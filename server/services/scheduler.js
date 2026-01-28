import cron from 'node-cron';
import webpush from 'web-push';
import { getDbSync } from '../db/database.js';

// Configure web-push
export function initializeWebPush() {
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Send push notification to a user
async function sendPushNotification(userId, payload) {
  const db = getDbSync();
  const subscriptions = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify(payload),
        {
          TTL: 60,
          urgency: 'high'
        }
      );
    } catch (err) {
      console.error(`Push notification failed for user ${userId}:`, err.message);
      // Remove invalid subscription
      if (err.statusCode === 410 || err.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }
}

// Check for classes happening in 7 days and send reminders
export async function checkAndSendReminders() {
  console.log('Running reminder check...');

  const db = getDbSync();
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 7);

  const targetDateStr = targetDate.toISOString().split('T')[0];
  const targetDayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Find one-time classes happening in 7 days
  const oneTimeClasses = db.prepare(`
    SELECT classes.*, users.name as user_name
    FROM classes
    JOIN users ON classes.user_id = users.id
    WHERE classes.is_recurring = 0
      AND classes.is_cancelled = 0
      AND date(classes.date_time) = date(?)
      AND NOT EXISTS (
        SELECT 1 FROM notifications_sent
        WHERE notifications_sent.class_id = classes.id
          AND notifications_sent.target_date = ?
      )
  `).all(targetDateStr, targetDateStr);

  // Find recurring classes happening on the target day of week
  const recurringClasses = db.prepare(`
    SELECT classes.*, users.name as user_name
    FROM classes
    JOIN users ON classes.user_id = users.id
    WHERE classes.is_recurring = 1
      AND classes.is_cancelled = 0
      AND classes.recurring_day = ?
      AND NOT EXISTS (
        SELECT 1 FROM notifications_sent
        WHERE notifications_sent.class_id = classes.id
          AND notifications_sent.target_date = ?
      )
  `).all(targetDayOfWeek, targetDateStr);

  const allClasses = [...oneTimeClasses, ...recurringClasses];

  console.log(`Found ${allClasses.length} classes needing reminders`);

  for (const cls of allClasses) {
    const dayStr = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    // Record that notification was sent first to get the notification ID
    const result = db.prepare(`
      INSERT INTO notifications_sent (class_id, target_date)
      VALUES (?, ?)
    `).run(cls.id, targetDateStr);

    const notificationId = result.lastInsertRowid;

    const payload = {
      aps: {
        alert: {
          title: 'Class Cancellation Reminder',
          body: `Your ${cls.class_type} class "${cls.title}" is in 7 days (${dayStr}). Today is the last day to cancel without penalty!`
        },
        sound: 'default'
      },
      data: {
        classId: cls.id,
        notificationId: notificationId,
        url: `/respond/${notificationId}`
      }
    };

    await sendPushNotification(cls.user_id, payload);

    console.log(`Sent reminder for class ${cls.id} (notification ${notificationId}) to user ${cls.user_id}`);
  }

  console.log('Reminder check complete');
}

// Start the scheduler - runs every day at 9 AM
export function startScheduler() {
  // Run at 9:00 AM every day
  cron.schedule('0 9 * * *', () => {
    checkAndSendReminders().catch(err => {
      console.error('Scheduler error:', err);
    });
  });

  console.log('Scheduler started - will run daily at 9 AM');
}

// Manual trigger for testing
export async function triggerManualCheck() {
  return checkAndSendReminders();
}
