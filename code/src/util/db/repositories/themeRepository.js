import { getDb } from '../sqlite';
import { safeStringify } from '../serialize';

const ROW_ID = 1;

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

async function ensureThemeRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO theme_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

export async function saveThemeState(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureThemeRow(db, now);
     await db.runAsync(
          `UPDATE theme_state SET
                updated_at = ?,
                theme_id = ?,
                color_mode = ?,
                text_color = ?,
                theme_colors_json = ?
           WHERE id = ?;`,
          [
               now,
               numberOrNull(state.themeId),
               state.colorMode ?? null,
               state.textColor ?? null,
               safeStringify(state.themeColors ?? null),
               ROW_ID,
          ]
     );
}

export async function loadThemeState() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT * FROM theme_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) return null;

     return {
          themeId: row.theme_id ?? null,
          colorMode: row.color_mode ?? 'light',
          textColor: row.text_color ?? 'textLight950',
          themeColors: safeParse(row.theme_colors_json),
          updatedAt: row.updated_at ?? 0,
     };
}

export async function saveThemeColors(themeColors, themeId) {
     const current = await loadThemeState();
     await saveThemeState({
          ...current,
          themeId: themeId ?? current?.themeId ?? null,
          themeColors: themeColors ?? null,
     });
}

export async function saveThemeColorMode(colorMode) {
     const current = await loadThemeState();
     const nextTextColor = colorMode === 'dark' ? 'textLight50' : 'textLight950';
     await saveThemeState({
          ...current,
          colorMode,
          textColor: nextTextColor,
     });
}

export async function saveThemeTextColor(textColor) {
     const current = await loadThemeState();
     await saveThemeState({
          ...current,
          textColor,
     });
}

export async function resetThemeState() {
     const db = await getDb();
     const now = Date.now();
     await ensureThemeRow(db, now);
     await db.runAsync(
          `UPDATE theme_state SET
                updated_at = ?,
                theme_colors_json = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
}

export async function isStoredThemeIdMatch(themeId) {
     const current = await loadThemeState();
     const currentThemeId = numberOrNull(current?.themeId);
     const incomingThemeId = numberOrNull(themeId);
     if (incomingThemeId === null || currentThemeId === null) {
          return false;
     }
     return currentThemeId === incomingThemeId;
}

