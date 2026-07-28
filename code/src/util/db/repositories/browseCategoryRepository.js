import { getDb } from '../sqlite';
import { safeStringify } from '../serialize';

const ROW_ID = 1;
const CACHE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

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

async function ensureBrowseCategoryRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO browse_category_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

async function ensureBrowseCategoryListRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO browse_category_list (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

export function isCacheExpired(updatedAt) {
     if (!updatedAt) return true;
     return Date.now() - updatedAt > CACHE_DURATION_MS;
}

// ─── browse_category_state: Category display data ─────────────────────────────

/**
 * Saves the browse categories array and metadata.
 * Called when the home screen feed is fetched from API.
 */
export async function saveBrowseCategories(categories = []) {
     if (!Array.isArray(categories)) {
          return false;
     }
     const db = await getDb();
     const now = Date.now();
     await ensureBrowseCategoryRow(db, now);
     await db.runAsync(
          `UPDATE browse_category_state SET
                updated_at = ?,
                categories_json = ?
           WHERE id = ?;`,
          [now, safeStringify(categories), ROW_ID]
     );
     return true;
}

/**
 * Loads the browse categories from database.
 */
export async function loadBrowseCategories() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT categories_json, updated_at FROM browse_category_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return {
          data: safeParse(row?.categories_json) ?? [],
          updatedAt: row?.updated_at ?? 0,
          isExpired: isCacheExpired(row?.updated_at),
     };
}

/**
 * Saves the maximum number of categories to display.
 */
export async function saveMaxCategories(maxNum = 5) {
     const db = await getDb();
     const now = Date.now();
     const normalizedMax = numberOrNull(maxNum);
     const safeMax = normalizedMax && normalizedMax > 0 ? normalizedMax : 5;
     await ensureBrowseCategoryRow(db, now);
     await db.runAsync(
          `UPDATE browse_category_state SET
                updated_at = ?,
                max_categories = ?
           WHERE id = ?;`,
           [now, safeMax, ROW_ID]
     );
}

/**
 * Loads the maximum number of categories from database.
 */
export async function loadMaxCategories() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT max_categories FROM browse_category_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     const value = numberOrNull(row?.max_categories);
     return value && value > 0 ? value : 5;
}

// ─── browse_category_list: User's available categories with visibility status ──

/**
 * Saves the list of available browse categories with visibility status.
 * Called when user manages browse categories.
 */
export async function saveBrowseCategoryList(list = []) {
     if (!Array.isArray(list)) {
          return false;
     }
     const db = await getDb();
     const now = Date.now();
     await ensureBrowseCategoryListRow(db, now);
     await db.runAsync(
          `UPDATE browse_category_list SET
                updated_at = ?,
                list_json = ?
           WHERE id = ?;`,
          [now, safeStringify(list), ROW_ID]
     );
     return true;
}

/**
 * Loads the browse category list from database.
 */
export async function loadBrowseCategoryList() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT list_json, updated_at FROM browse_category_list WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return {
          data: safeParse(row?.list_json) ?? [],
          updatedAt: row?.updated_at ?? 0,
          isExpired: isCacheExpired(row?.updated_at),
     };
}

/**
 * Updates a single category's visibility status (optimistic update).
 * Used for immediate UI feedback when user toggles hide/show.
 */
export async function updateBrowseCategoryVisibility(categoryKey, isHidden) {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT list_json FROM browse_category_list WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) return false;

     const list = safeParse(row.list_json) ?? [];
     const categoryIndex = list.findIndex(cat => cat.key === categoryKey);

     if (categoryIndex === -1) return false;

     list[categoryIndex].isHidden = isHidden;

     await db.runAsync(
          `UPDATE browse_category_list SET
                updated_at = ?,
                list_json = ?
           WHERE id = ?;`,
          [Date.now(), safeStringify(list), ROW_ID]
     );

     return true;
}

// ─── Utility functions ─────────────────────────────────────────────────────────

/**
 * Saves all browse category data in a single transaction.
 * Used during app initialization.
 */
export async function saveAllBrowseCategoryData(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureBrowseCategoryRow(db, now);
     await ensureBrowseCategoryListRow(db, now);

     await db.withTransactionAsync(async () => {
          await saveBrowseCategories(state.categories ?? []);
          await saveMaxCategories(state.maxCategories ?? 5);
          await saveBrowseCategoryList(state.categoryList ?? []);
     });
}

/**
 * Loads all browse category data from database.
 */
export async function loadAllBrowseCategoryData() {
     const db = await getDb();
     const categoryRow = await db.getFirstAsync(
          `SELECT * FROM browse_category_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     const listRow = await db.getFirstAsync(
          `SELECT * FROM browse_category_list WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!categoryRow && !listRow) return null;

     return {
          categories: safeParse(categoryRow?.categories_json) ?? [],
          maxCategories: numberOrNull(categoryRow?.max_categories) ?? 5,
          categoryList: safeParse(listRow?.list_json) ?? [],
          categoriesUpdatedAt: categoryRow?.updated_at ?? 0,
          categoriesExpired: isCacheExpired(categoryRow?.updated_at),
          listUpdatedAt: listRow?.updated_at ?? 0,
          listExpired: isCacheExpired(listRow?.updated_at),
     };
}

/**
 * Resets all browse category data (typically on logout).
 */
export async function resetAllBrowseCategoryData() {
     const db = await getDb();
     const now = Date.now();
     await db.runAsync(
          `UPDATE browse_category_state SET
                updated_at = ?,
                categories_json = NULL,
                max_categories = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
     await db.runAsync(
          `UPDATE browse_category_list SET
                updated_at = ?,
                list_json = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
}

