import * as SQLite from 'expo-sqlite';
import { versionUpdates, compareReleaseKeys } from './versionUpdates';
import { logDebugMessage, logErrorMessage } from '../logging';

const DB_NAME = 'aspen_lida.db';
let dbPromise = null;

/**
 * Returns a singleton instance of the SQLite database connection.
 * The opening promise (not the instance) is cached so concurrent callers during
 * startup share one connection instead of each opening their own, which caused
 * "database is locked" errors on Android. If opening fails, the cache is cleared
 * so a later call can retry.
 * @returns {Promise<*>}
 */
export async function getDb() {
     if (!dbPromise) {
          dbPromise = SQLite.openDatabaseAsync(DB_NAME).catch((error) => {
               dbPromise = null;
               throw error;
          });
     }
     return dbPromise;
}

/**
 * Executes the provided function within a database transaction.
 * If the transaction fails, it will be rolled back and an error will be logged.
 * @param fn
 * @returns {Promise<void>}
 */
export async function withTransaction(fn) {
     const db = await getDb();
     await db.withTransactionAsync(async () => {
          await fn(db);
     });
}

/**
 * Ensures that the schema_updates table exists in the database, creating it if necessary.
 * @param db
 * @returns {Promise<void>}
 */
async function ensureUpdatesTable(db) {
     await db.execAsync(`
          CREATE TABLE IF NOT EXISTS schema_updates (
               key TEXT PRIMARY KEY,
               applied_at INTEGER NOT NULL
          );
     `);
}

/**
 * Retrieves the set of updates keys that have already been applied to the database.
 * @param db
 * @returns {Promise<Set<any>>}
 */
async function getAppliedKeys(db) {
     const rows = await db.getAllAsync(`SELECT key FROM schema_updates;`);
     return new Set((rows ?? []).map((r) => r.key));
}

/**
 * Records the application of an update by inserting its key and
 * the current timestamp into the schema_updates table.
 * @param db
 * @param key
 * @returns {Promise<void>}
 */
async function recordUpdate(db, key) {
     await db.runAsync(`INSERT INTO schema_updates (key, applied_at) VALUES (?, ?);`, [key, Date.now()]);
}

/**
 * Runs all pending database versionUpdates in order, ensuring that each file is only applied once.
 * @returns {Promise<void>}
 */
export async function runUpdates() {
     const db = await getDb();

     await db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;
     `);

     await ensureUpdatesTable(db);
     const applied = await getAppliedKeys(db);

     const ordered = [...versionUpdates].sort(compareReleaseKeys);

     for (const update of ordered) {
          if (!update?.key || typeof update.up !== 'function') {
               continue;
          }
          if (applied.has(update.key)) {
               continue;
          }

          logDebugMessage(`Applying DB update ${update.key}`);
          await db.withTransactionAsync(async () => {
               await update.up(db);
               await recordUpdate(db, update.key);
          });
          logDebugMessage(`Applied DB update ${update.key}`);
     }
}

/**
 * Initializes the SQLite database by running any pending updates.
 * If the initialization is successful, it returns true.
 * @returns {Promise<boolean>}
 */
export async function initDatabase() {
     try {
          await runUpdates();
          logDebugMessage('SQLite init complete');
          return true;
     } catch (error) {
          logErrorMessage('SQLite init failed');
          logErrorMessage(error);
          throw error;
     }
}

/**
 * Drops all non-system tables and reapplies migrations.
 * Intended for development/debug flows only.
 */
export async function resetDatabase() {
     if (!__DEV__) {
          throw new Error('resetDatabase is disabled outside development mode');
     }

     const db = await getDb();
     try {
          logDebugMessage('Resetting database...');
          await db.execAsync(`PRAGMA foreign_keys = OFF;`);
          const tables = await db.getAllAsync(`
               SELECT name
               FROM sqlite_master
               WHERE type = 'table'
                 AND name NOT LIKE 'sqlite_%';
          `);

          for (const row of tables ?? []) {
               const tableName = row?.name;
               if (!tableName) continue;
               await db.execAsync(`DROP TABLE IF EXISTS "${tableName}";`);
          }

          await db.execAsync(`PRAGMA foreign_keys = ON;`);
          await runUpdates();
          logDebugMessage('Database reset complete');
          return true;
     } catch (error) {
          logErrorMessage('Database reset failed');
          logErrorMessage(error);
          throw error;
     }
}