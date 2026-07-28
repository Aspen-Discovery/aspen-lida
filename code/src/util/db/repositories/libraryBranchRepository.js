import { getDb } from '../sqlite';
import { safeStringify } from '../serialize';

const ROW_ID = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function boolToInt(value) {
     if (typeof value !== 'boolean') return null;
     return value ? 1 : 0;
}

function intToBool(value) {
     if (value === 1) return true;
     if (value === 0) return false;
     return null;
}

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

async function ensureLibraryBranchRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO library_branch_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

// ─── library_branch_state: targeted partial saves ─────────────────────────────

/**
 * Saves the current location (branch) object.
 * Called when location info is fetched from API.
 * Location object contains all branch details including hours and display settings.
 */
export async function saveLocation(location = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                location_id = ?,
                display_name = ?,
                library_id = ?,
                is_main_branch = ?,
                solr_scope = ?,
                location_json = ?
           WHERE id = ?;`,
          [
               now,
               numberOrNull(location.locationId),
               location.displayName ?? null,
               numberOrNull(location.libraryId),
               boolToInt(location.isMainBranch),
               location.solrScope ?? null,
               safeStringify(location),
               ROW_ID,
          ]
     );
}

/**
 * Loads the current location from database.
 */
export async function loadLocation() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT location_json FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.location_json);
}

/**
 * Saves the search scope for the current location.
 */
export async function saveScope(scope = '') {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                scope = ?
           WHERE id = ?;`,
          [now, scope ?? null, ROW_ID]
     );
}

/**
 * Loads the search scope from database.
 */
export async function loadScope() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT scope FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return row?.scope ?? '';
}

/**
 * Saves self-check enabled status.
 */
export async function saveSelfCheckEnabled(enabled = false) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                self_check_enabled = ?
           WHERE id = ?;`,
          [now, boolToInt(enabled), ROW_ID]
     );
}

/**
 * Loads self-check enabled status from database.
 */
export async function loadSelfCheckEnabled() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT self_check_enabled FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return intToBool(row?.self_check_enabled) ?? false;
}

/**
 * Saves self-check settings (barcode styles, keyboard type, etc.).
 */
export async function saveSelfCheckSettings(settings = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                self_check_settings_json = ?
           WHERE id = ?;`,
          [now, safeStringify(settings), ROW_ID]
     );
}

/**
 * Loads self-check settings from database.
 */
export async function loadSelfCheckSettings() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT self_check_settings_json FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.self_check_settings_json) ?? {};
}

/**
 * Saves all available locations (branches).
 * Stores as JSON array for easy retrieval.
 */
export async function saveLocations(locations = []) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                locations_json = ?
           WHERE id = ?;`,
          [now, safeStringify(locations), ROW_ID]
     );
}

/**
 * Loads all available locations from database.
 */
export async function loadLocations() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT locations_json FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.locations_json) ?? [];
}

// ─── Utility functions ─────────────────────────────────────────────────────────

/**
 * Saves all library branch data in a single database transaction.
 * Used when initializing library branch data on app startup.
 */
export async function saveAllLibraryBranchData(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLibraryBranchRow(db, now);

     await db.withTransactionAsync(async () => {
          await saveLocation(state.location ?? {});
          await saveScope(state.scope ?? '');
          await saveSelfCheckEnabled(state.enableSelfCheck ?? false);
          await saveSelfCheckSettings(state.selfCheckSettings ?? {});
          await saveLocations(state.locations ?? []);
     });
}

/**
 * Loads all library branch data from database.
 */
export async function loadAllLibraryBranchData() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT * FROM library_branch_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) return null;

     return {
          location: safeParse(row.location_json),
          scope: row.scope ?? '',
          enableSelfCheck: intToBool(row.self_check_enabled) ?? false,
          selfCheckSettings: safeParse(row.self_check_settings_json) ?? {},
          locations: safeParse(row.locations_json) ?? [],
          updatedAt: row.updated_at ?? 0,
     };
}

/**
 * Resets all library branch data (typically on logout).
 */
export async function resetAllLibraryBranchData() {
     const db = await getDb();
     const now = Date.now();
     await db.runAsync(
          `UPDATE library_branch_state SET
                updated_at = ?,
                location_id = NULL,
                display_name = NULL,
                library_id = NULL,
                is_main_branch = NULL,
                solr_scope = NULL,
                scope = NULL,
                self_check_enabled = NULL,
                location_json = NULL,
                self_check_settings_json = NULL,
                locations_json = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
}

