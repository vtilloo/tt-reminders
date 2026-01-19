import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { getDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import pushRoutes from './routes/push.js';
import adminRoutes from './routes/admin.js';
import { initializeWebPush, startScheduler, triggerManualCheck } from './services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);

// Manual trigger endpoint (for testing)
app.post('/api/trigger-reminders', async (req, res) => {
  try {
    await triggerManualCheck();
    res.json({ success: true, message: 'Reminder check triggered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

// Initialize database and start server
async function start() {
  try {
    // Initialize database
    await getDb();
    console.log('Database initialized');

    // Initialize web-push and start scheduler
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      initializeWebPush();
      startScheduler();
    } else {
      console.warn('VAPID keys not configured - push notifications disabled');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
