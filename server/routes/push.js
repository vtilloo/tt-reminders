import { Router } from 'express';
import webpush from 'web-push';
import { getDbSync } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
  try {
    const db = getDbSync();
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Remove existing subscription for this user (if any)
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(req.user.id);

    // Insert new subscription
    db.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, endpoint, keys.p256dh, keys.auth);

    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsubscribe from push notifications
router.delete('/unsubscribe', (req, res) => {
  try {
    const db = getDbSync();
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check subscription status
router.get('/status', (req, res) => {
  try {
    const db = getDbSync();
    const sub = db.prepare('SELECT id FROM push_subscriptions WHERE user_id = ?').get(req.user.id);
    res.json({ subscribed: !!sub });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const db = getDbSync();
    const sub = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').get(req.user.id);

    if (!sub) {
      return res.status(400).json({ error: 'No push subscription found. Enable notifications first.' });
    }

    // Ensure VAPID is configured
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      aps: {
        alert: {
          title: 'Test Notification',
          body: 'Push notifications are working! You will receive reminders 7 days before your classes.'
        },
        sound: 'default'
      },
      data: { url: '/dashboard' }
    });

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      },
      payload,
      {
        TTL: 60,
        urgency: 'high'
      }
    );

    res.json({ success: true, message: 'Test notification sent!' });
  } catch (err) {
    console.error('Test notification error:', err);
    res.status(500).json({ error: 'Failed to send notification: ' + err.message });
  }
});

export default router;
