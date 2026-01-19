import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'reminders.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

let db = null;

// Initialize database
async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Run schema - split by semicolon and run each statement
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      db.run(stmt);
    } catch (e) {
      // Ignore errors for IF NOT EXISTS statements
    }
  }

  // Save to disk
  saveDb();

  return db;
}

// Save database to disk
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

// Wrapper for better-sqlite3 compatible API
class Database {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        try {
          const stmt = self._db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          stmt.step();
          stmt.free();

          // Get last insert rowid immediately after insert
          const lastIdResult = self._db.exec('SELECT last_insert_rowid() as id');
          const lastInsertRowid = lastIdResult[0]?.values[0]?.[0] || 0;
          const changes = self._db.getRowsModified();

          saveDb();
          return {
            changes,
            lastInsertRowid
          };
        } catch (err) {
          console.error('SQL run error:', err.message, 'SQL:', sql, 'Params:', params);
          throw err;
        }
      },
      get(...params) {
        try {
          const stmt = self._db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (err) {
          console.error('SQL get error:', err.message, 'SQL:', sql, 'Params:', params);
          throw err;
        }
      },
      all(...params) {
        try {
          const results = [];
          const stmt = self._db.prepare(sql);
          if (params.length > 0) {
            stmt.bind(params);
          }
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (err) {
          console.error('SQL all error:', err.message, 'SQL:', sql, 'Params:', params);
          throw err;
        }
      }
    };
  }

  _getLastInsertRowId() {
    const result = this._db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] || 0;
  }

  exec(sql) {
    this._db.run(sql);
    saveDb();
  }

  pragma(pragma) {
    // sql.js doesn't support all pragmas, but we can try
    try {
      this._db.run(`PRAGMA ${pragma}`);
    } catch (e) {
      // Ignore pragma errors
    }
  }
}

// Export a promise that resolves to the database wrapper
let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    await initDb();
    dbInstance = new Database(db);
  }
  return dbInstance;
}

// For synchronous access after initialization
export function getDbSync() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call getDb() first.');
  }
  return dbInstance;
}

export default { getDb, getDbSync };
