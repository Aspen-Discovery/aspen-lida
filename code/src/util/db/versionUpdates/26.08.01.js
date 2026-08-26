export const key = '26.08.01';

/**
 * Creates persistent storage tables for user data.
 * user_state holds all scalar fields for the logged-in user and session settings.
 * Each collection (accounts, lists, etc.) gets its own table for independent querying.
 *
 * library_system_state holds library configuration and system-wide data.
 * Stores library URL, metadata, menu links, catalog status, home screen links, and app settings.
 * @param db
 * @returns {Promise<void>}
 */
export async function up(db) {
     await db.execAsync(`
          DROP TABLE IF EXISTS language_state;

          CREATE TABLE language_state (
               language_code TEXT PRIMARY KEY,
               updated_at INTEGER NOT NULL,
               dictionary_json TEXT NOT NULL
          );
       `);
}
