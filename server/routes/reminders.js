import { Router } from 'express';
import { getDbSync } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { sendSkipNotification } from '../services/email.js';

const router = Router();

// Get reminder details for response page
router.get('/:notificationId', authenticate, (req, res) => {
  try {
    const db = getDbSync();
    const { notificationId } = req.params;

    // Get notification and class details
    const notification = db.prepare(`
      SELECT
        ns.id as notification_id,
        ns.class_id,
        ns.target_date,
        ns.sent_at,
        c.title,
        c.class_type,
        c.instructor,
        c.is_recurring,
        c.recurring_day,
        c.recurring_time,
        c.date_time,
        c.user_id
      FROM notifications_sent ns
      JOIN classes c ON ns.class_id = c.id
      WHERE ns.id = ?
    `).get(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Verify this reminder belongs to the authenticated user
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already responded
    const existingResponse = db.prepare(`
      SELECT response, responded_at
      FROM reminder_responses
      WHERE notification_id = ?
    `).get(notificationId);

    res.json({
      notification_id: notification.notification_id,
      class_id: notification.class_id,
      title: notification.title,
      class_type: notification.class_type,
      instructor: notification.instructor,
      is_recurring: notification.is_recurring,
      target_date: notification.target_date,
      recurring_time: notification.recurring_time,
      date_time: notification.date_time,
      sent_at: notification.sent_at,
      already_responded: !!existingResponse,
      previous_response: existingResponse?.response || null,
      responded_at: existingResponse?.responded_at || null
    });
  } catch (err) {
    console.error('Get reminder error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit response to reminder
router.post('/:notificationId/respond', authenticate, async (req, res) => {
  try {
    const db = getDbSync();
    const { notificationId } = req.params;
    const { response } = req.body;

    if (!response || !['yes', 'no'].includes(response)) {
      return res.status(400).json({ error: 'Response must be "yes" or "no"' });
    }

    // Get notification details
    const notification = db.prepare(`
      SELECT
        ns.id as notification_id,
        ns.class_id,
        ns.target_date,
        c.title,
        c.user_id
      FROM notifications_sent ns
      JOIN classes c ON ns.class_id = c.id
      WHERE ns.id = ?
    `).get(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Verify this reminder belongs to the authenticated user
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already responded
    const existingResponse = db.prepare(`
      SELECT id FROM reminder_responses WHERE notification_id = ?
    `).get(notificationId);

    if (existingResponse) {
      return res.status(400).json({ error: 'Already responded to this reminder' });
    }

    // Record the response
    db.prepare(`
      INSERT INTO reminder_responses (notification_id, user_id, class_id, response)
      VALUES (?, ?, ?, ?)
    `).run(notificationId, req.user.id, notification.class_id, response);

    // If response is "no", send email to club
    let emailResult = null;
    if (response === 'no') {
      // Get user email
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);

      emailResult = await sendSkipNotification(
        user.email,
        user.name,
        notification.title,
        notification.target_date
      );
    }

    res.json({
      success: true,
      response,
      email_sent: response === 'no' ? emailResult?.success : null
    });
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get skipped classes analytics for current user
router.get('/analytics/skipped', authenticate, (req, res) => {
  try {
    const db = getDbSync();

    const stats = db.prepare(`
      SELECT
        strftime('%Y-%m', rr.responded_at) as month,
        COUNT(*) as skipped_count
      FROM reminder_responses rr
      WHERE rr.user_id = ?
        AND rr.response = 'no'
        AND rr.responded_at >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month
    `).all(req.user.id);

    res.json(stats);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
