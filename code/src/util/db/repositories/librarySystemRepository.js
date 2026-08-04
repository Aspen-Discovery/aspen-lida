import { getDb } from '../sqlite';
import { safeStringify } from '../serialize';

const ROW_ID = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function numberOrNull(value) {
     const num = Number(value);
     return Number.isFinite(num) ? num : null;
}

function safeParse(json) {
     if (!json || typeof json !== 'string') return null;
     try {
          return JSON.parse(json);
     } catch {
          return null;
     }
}

async function ensureLibrarySystemRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO library_system_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

// ─── library_system_state: targeted partial saves ────────────────────────────

/**
 * Saves the library URL.
 */
export async function saveLibraryUrl(url = '') {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                url = ?
           WHERE id = ?;`,
          [now, url ?? null, ROW_ID]
     );
}

/**
 * Loads the library URL from database.
 */
export async function loadLibraryUrl() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT url FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return row?.url ?? '';
}

/**
 * Saves the library version.
 */
export async function saveLibraryVersion(version = '') {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                version = ?
           WHERE id = ?;`,
          [now, version ?? null, ROW_ID]
     );
}

/**
 * Loads the library version from database.
 */
export async function loadLibraryVersion() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT version FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return row?.version ?? '';
}

/**
 * Saves library metadata (name, favicon, library_id, languages, localIll).
 */
export async function saveLibraryMetadata(metadata = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                name = ?,
                favicon = ?,
                library_id = ?,
                languages_json = ?,
                local_ill_json = ?
           WHERE id = ?;`,
          [
               now,
               metadata.name ?? null,
               metadata.favicon ?? null,
               numberOrNull(metadata.libraryId),
               safeStringify(metadata.languages ?? []),
               safeStringify(metadata.localIll ?? []),
               ROW_ID,
          ]
     );
}

/**
 * Loads library metadata from database.
 */
export async function loadLibraryMetadata() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT name, favicon, library_id, languages_json, local_ill_json FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     if (!row) return null;
     return {
          name: row.name ?? null,
          favicon: row.favicon ?? null,
          libraryId: row.library_id ?? null,
          languages: safeParse(row.languages_json) ?? [],
          localIll: safeParse(row.local_ill_json) ?? [],
     };
}

/**
 * Saves the complete library object (from getLibraryInfo API response).
 */
export async function saveLibrary(library = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                library_json = ?
           WHERE id = ?;`,
          [now, safeStringify(library), ROW_ID]
     );
}

/**
 * Loads the complete library object from database.
 */
export async function loadLibrary() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT library_json FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.library_json) ?? {};
}

/**
 * Saves menu links.
 */
export async function saveMenu(menu = []) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                menu_json = ?
           WHERE id = ?;`,
          [now, safeStringify(menu), ROW_ID]
     );
}

/**
 * Loads menu links from database.
 */
export async function loadMenu() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT menu_json FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.menu_json) ?? [];
}

/**
 * Saves catalog status and status message.
 */
export async function saveCatalogStatus(status = 0, message = '') {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                catalog_status = ?,
                catalog_status_message = ?
           WHERE id = ?;`,
          [now, numberOrNull(status), message ?? null, ROW_ID]
     );
}

/**
 * Loads catalog status and message from database.
 */
export async function loadCatalogStatus() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT catalog_status, catalog_status_message FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return {
          status: row?.catalog_status ?? 0,
          message: row?.catalog_status_message ?? '',
     };
}

/**
 * Saves home screen links.
 */
export async function saveHomeScreenLinks(links = []) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                home_screen_links_json = ?
           WHERE id = ?;`,
          [now, safeStringify(links), ROW_ID]
     );
}

/**
 * Loads home screen links from database.
 */
export async function loadHomeScreenLinks() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT home_screen_links_json FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.home_screen_links_json) ?? [];
}

/**
 * Saves app settings with URL/slug cache for staleness checking.
 */
export async function saveAppSettings(settings = {}, urlCache = '', slugCache = '') {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                app_settings_json = ?,
                app_settings_url_cache = ?,
                app_settings_slug_cache = ?
           WHERE id = ?;`,
          [now, safeStringify(settings), urlCache ?? null, slugCache ?? null, ROW_ID]
     );
}

/**
 * Loads app settings with cache metadata from database.
 */
export async function loadAppSettings() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT app_settings_json, app_settings_url_cache, app_settings_slug_cache, updated_at FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     if (!row) return null;
     return {
          settings: safeParse(row.app_settings_json) ?? {},
          urlCache: row.app_settings_url_cache ?? '',
          slugCache: row.app_settings_slug_cache ?? '',
          updatedAt: row.updated_at ?? 0,
     };
}

// ─── Utility functions ─────────────────────────────────────────────────────────

/**
 * Saves all library system data in a single database transaction.
 * Used when initializing library system data on app startup.
 */
export async function saveAllLibrarySystemData(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibrarySystemRow(db, now);

     await db.withTransactionAsync(async () => {
          await saveLibraryUrl(state.url ?? '');
          await saveLibraryVersion(state.version ?? '');
          await saveLibraryMetadata(state.metadata ?? {});
          await saveLibrary(state.library ?? {});
          await saveMenu(state.menu ?? []);
          await saveCatalogStatus(state.catalogStatus ?? 0, state.catalogStatusMessage ?? '');
          await saveHomeScreenLinks(state.homeScreenLinks ?? []);
          await saveAppSettings(
               state.appSettings ?? {},
               state.appSettingsUrlCache ?? '',
               state.appSettingsSlugCache ?? ''
          );
     });
}

/**
 * Loads all library system data from database.
 */
export async function loadAllLibrarySystemData() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT * FROM library_system_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) return null;

     return {
          url: row.url ?? '',
          version: row.version ?? '',
          name: row.name ?? null,
          favicon: row.favicon ?? null,
          libraryId: row.library_id ?? null,
          languages: safeParse(row.languages_json) ?? [],
          localIll: safeParse(row.local_ill_json) ?? [],
          library: safeParse(row.library_json) ?? {},
          menu: safeParse(row.menu_json) ?? [],
          catalogStatus: row.catalog_status ?? 0,
          catalogStatusMessage: row.catalog_status_message ?? '',
          homeScreenLinks: safeParse(row.home_screen_links_json) ?? [],
          appSettings: safeParse(row.app_settings_json) ?? {},
          appSettingsUrlCache: row.app_settings_url_cache ?? '',
          appSettingsSlugCache: row.app_settings_slug_cache ?? '',
          updatedAt: row.updated_at ?? 0,
     };
}

/**
 * Resets all library system data (typically on logout).
 */
export async function resetAllLibrarySystemData() {
     const db = await getDb();
     const now = Date.now();
     await db.runAsync(
          `UPDATE library_system_state SET
                updated_at = ?,
                url = NULL,
                name = NULL,
                favicon = NULL,
                library_id = NULL,
                version = NULL,
                languages_json = NULL,
                local_ill_json = NULL,
                library_json = NULL,
                menu_json = NULL,
                catalog_status = NULL,
                catalog_status_message = NULL,
                home_screen_links_json = NULL,
                app_settings_json = NULL,
                app_settings_url_cache = NULL,
                app_settings_slug_cache = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
}

