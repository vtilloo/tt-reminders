import { Router } from 'express';
import { getDbSync } from '../db/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/users', (req, res) => {
  try {
    const db = getDbSync();
    const users = db.prepare(`
      SELECT id, email, name, is_admin, created_at,
        (SELECT COUNT(*) FROM classes WHERE user_id = users.id) as class_count,
        (SELECT COUNT(*) FROM push_subscriptions WHERE user_id = users.id) as has_push
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all classes
router.get('/classes', (req, res) => {
  try {
    const db = getDbSync();
    const classes = db.prepare(`
      SELECT classes.*, users.name as user_name, users.email as user_email
      FROM classes
      JOIN users ON classes.user_id = users.id
      ORDER BY classes.created_at DESC
    `).all();
    res.json(classes);
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics
router.get('/stats', (req, res) => {
  try {
    const db = getDbSync();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get().count;
    const cancelledClasses = db.prepare('SELECT COUNT(*) as count FROM classes WHERE is_cancelled = 1').get().count;
    const recurringClasses = db.prepare('SELECT COUNT(*) as count FROM classes WHERE is_recurring = 1').get().count;
    const pushSubscribers = db.prepare('SELECT COUNT(*) as count FROM push_subscriptions').get().count;
    const notificationsSent = db.prepare('SELECT COUNT(*) as count FROM notifications_sent').get().count;

    res.json({
      totalUsers,
      totalClasses,
      cancelledClasses,
      recurringClasses,
      pushSubscribers,
      notificationsSent
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
