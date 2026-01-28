import { Router } from 'express';
import { getDbSync } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';
import { sendSkipNotification } from '../services/email.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's classes
router.get('/', (req, res) => {
  try {
    const db = getDbSync();
    const classes = db.prepare(`
      SELECT * FROM classes
      WHERE user_id = ?
      ORDER BY
        CASE WHEN is_recurring = 1 THEN recurring_day ELSE date_time END
    `).all(req.user.id);
    res.json(classes);
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single class
router.get('/:id', (req, res) => {
  try {
    const db = getDbSync();
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(cls);
  } catch (err) {
    console.error('Get class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create class
router.post('/', (req, res) => {
  try {
    const db = getDbSync();
    const { title, class_type, instructor, notes, date_time, is_recurring, recurring_day, recurring_time } = req.body;

    if (!title || !class_type) {
      return res.status(400).json({ error: 'Title and class type are required' });
    }

    if (!is_recurring && !date_time) {
      return res.status(400).json({ error: 'Date and time required for non-recurring class' });
    }

    if (is_recurring && (recurring_day === undefined || !recurring_time)) {
      return res.status(400).json({ error: 'Day and time required for recurring class' });
    }

    const result = db.prepare(`
      INSERT INTO classes (user_id, title, class_type, instructor, notes, date_time, is_recurring, recurring_day, recurring_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      title,
      class_type,
      instructor || null,
      notes || null,
      is_recurring ? null : date_time,
      is_recurring ? 1 : 0,
      is_recurring ? recurring_day : null,
      is_recurring ? recurring_time : null
    );

    const newClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newClass);
  } catch (err) {
    console.error('Create class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update class
router.put('/:id', (req, res) => {
  try {
    const db = getDbSync();
    const { title, class_type, instructor, notes, date_time, is_recurring, recurring_day, recurring_time } = req.body;

    // Check ownership
    const existing = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Class not found' });
    }

    db.prepare(`
      UPDATE classes SET
        title = ?,
        class_type = ?,
        instructor = ?,
        notes = ?,
        date_time = ?,
        is_recurring = ?,
        recurring_day = ?,
        recurring_time = ?
      WHERE id = ? AND user_id = ?
    `).run(
      title || existing.title,
      class_type || existing.class_type,
      instructor !== undefined ? instructor : existing.instructor,
      notes !== undefined ? notes : existing.notes,
      is_recurring ? null : (date_time || existing.date_time),
      is_recurring ? 1 : 0,
      is_recurring ? recurring_day : null,
      is_recurring ? recurring_time : null,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete class
router.delete('/:id', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.prepare('DELETE FROM classes WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark class as cancelled/uncancelled
router.patch('/:id/cancel', async (req, res) => {
  try {
    const db = getDbSync();
    const { is_cancelled } = req.body;

    // Get class details before updating
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    db.prepare('UPDATE classes SET is_cancelled = ? WHERE id = ? AND user_id = ?')
      .run(is_cancelled ? 1 : 0, req.params.id, req.user.id);

    // Send email to club when class is cancelled
    if (is_cancelled) {
      const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(req.user.id);

      // Determine class date
      let classDate;
      if (cls.is_recurring) {
        // For recurring classes, find next occurrence
        const today = new Date();
        const daysUntil = (cls.recurring_day - today.getDay() + 7) % 7 || 7;
        classDate = new Date(today);
        classDate.setDate(today.getDate() + daysUntil);
      } else {
        classDate = cls.date_time;
      }

      await sendSkipNotification(user.email, user.name, cls.title, classDate);
    }

    const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Cancel class error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
