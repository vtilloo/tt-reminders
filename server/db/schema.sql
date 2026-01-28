-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  class_type TEXT NOT NULL CHECK (class_type IN ('one-on-one', 'group')),
  instructor TEXT,
  notes TEXT,
  date_time TEXT,
  is_recurring INTEGER DEFAULT 0,
  recurring_day INTEGER CHECK (recurring_day >= 0 AND recurring_day <= 6),
  recurring_time TEXT,
  is_cancelled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications sent table (to avoid duplicates)
CREATE TABLE IF NOT EXISTS notifications_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  target_date TEXT NOT NULL,
  sent_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(class_id, target_date)
);

-- Reminder responses table (tracks Yes/No responses to reminders)
CREATE TABLE IF NOT EXISTS reminder_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no')),
  responded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (notification_id) REFERENCES notifications_sent(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON classes(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_date_time ON classes(date_time);
CREATE INDEX IF NOT EXISTS idx_classes_recurring ON classes(is_recurring, recurring_day);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_responses_user_id ON reminder_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_responses_notification_id ON reminder_responses(notification_id);
