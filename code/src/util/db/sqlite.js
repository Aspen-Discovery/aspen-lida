import * as SQLite from 'expo-sqlite';
import { versionUpdates, compareReleaseKeys } from './versionUpdates';
import { logDebugMessage, logErrorMessage } from '../logging';

const DB_NAME = 'aspen_lida.db';
let dbInstance = null;
let openDbPromise = null;
let recoverDbPromise = null;
let dbInitialized = false;
let dbInitPromise = null;

const RETRYABLE_DB_ERROR_FRAGMENTS = [
     'NativeDatabase.prepareAsync',
     'NullPointerException',
];

const RECOVERY_METHODS = [
     'execAsync',
     'runAsync',
     'getFirstAsync',
     'getAllAsync',
     'withTransactionAsync',
];

function isRecoverableDbError(error) {
     const message = String(error?.message ?? error ?? '');
     return RETRYABLE_DB_ERROR_FRAGMENTS.some((fragment) => message.includes(fragment));
}

async function invokeDbMethod(db, methodName, args, hasRetried = false) {
     const activeDb = db.__aspenForwardDb ?? db;
     const original = activeDb.__aspenOriginalMethods?.[methodName];
     if (typeof original !== 'function') {
          throw new Error(`Missing SQLite method: ${methodName}`);
     }

     try {
          return await original(...args);
     } catch (error) {
          if (hasRetried || !isRecoverableDbError(error)) {
               throw error;
          }

          logDebugMessage(`SQLite ${methodName} failed; reopening DB and retrying once`);
          const reopenedDb = await recoverDb();

          // If callers keep a stale db reference, forward future calls to the reopened instance.
          if (db !== reopenedDb) {
               db.__aspenForwardDb = reopenedDb;
          }

          return invokeDbMethod(reopenedDb, methodName, args, true);
     }
}

function patchDbWithRecovery(db) {
     if (!db || db.__aspenRecoveryPatched) {
          return db;
     }

     const originalMethods = {};
     for (const methodName of RECOVERY_METHODS) {
          if (typeof db[methodName] === 'function') {
               originalMethods[methodName] = db[methodName].bind(db);
          }
     }

     Object.defineProperty(db, '__aspenOriginalMethods', {
          value: originalMethods,
          enumerable: false,
          configurable: false,
          writable: false,
     });

     for (const methodName of Object.keys(originalMethods)) {
          db[methodName] = async (...args) => invokeDbMethod(db, methodName, args, false);
     }

     Object.defineProperty(db, '__aspenRecoveryPatched', {
          value: true,
          enumerable: false,
          configurable: false,
          writable: false,
     });

     return db;
}

async function openPatchedDb() {
     const db = await SQLite.openDatabaseAsync(DB_NAME);
     return patchDbWithRecovery(db);
}

async function recoverDb() {
     if (!recoverDbPromise) {
          recoverDbPromise = (async () => {
               resetDb();
               return openOrGetDb();
          })().finally(() => {
               recoverDbPromise = null;
          });
     }

     return recoverDbPromise;
}

/**
 * Returns a singleton instance of the SQLite database connection.
 * If the connection has not been established yet, it will be created and stored for future use.
 * @returns {Promise<*>}
 */
async function openOrGetDb() {
     if (dbInstance) {
          if (!dbInstance.__aspenRecoveryPatched) {
               dbInstance = patchDbWithRecovery(dbInstance);
          }
          return dbInstance;
     }

     if (!openDbPromise) {
          openDbPromise = (async () => {
               const db = await openPatchedDb();
               dbInstance = db;
               return db;
          })().finally(() => {
               openDbPromise = null;
          });
     }

     return openDbPromise;
}

async function runPendingUpdates() {
     const db = await openOrGetDb();

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

async function ensureDbInitialized() {
     if (dbInitialized) {
          return;
     }

     if (!dbInitPromise) {
          dbInitPromise = (async () => {
               await runPendingUpdates();
               dbInitialized = true;
          })();
     }

     try {
          await dbInitPromise;
     } catch (error) {
          dbInitPromise = null;
          throw error;
     }
}

export async function getDb() {
     await ensureDbInitialized();
     return openOrGetDb();
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
     await runPendingUpdates();
     dbInitialized = true;
}

/**
 * Initializes the SQLite database by running any pending updates.
 * If the initialization is successful, it returns true.
 * @returns {Promise<boolean>}
 */
export async function initDatabase() {
     try {
          await ensureDbInitialized();
          logDebugMessage('SQLite init complete');
          return true;
     } catch (error) {
          logErrorMessage('SQLite init failed');
          logErrorMessage(error);
          throw error;
     }
}

export function resetDb() {
     dbInstance = null;
     openDbPromise = null;
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
           dbInitialized = false;
           dbInitPromise = null;
           await runUpdates();
          logDebugMessage('Database reset complete');
          return true;
     } catch (error) {
          logErrorMessage('Database reset failed');
          logErrorMessage(error);
          throw error;
     }
}