import { getDb } from '../sqlite';
import { safeStringify } from '../serialize';

const ROW_ID = 1;

function safeParse(json) {
     if (!json || typeof json !== 'string') return null;
     try {
          return JSON.parse(json);
     } catch {
          return null;
     }
}

async function ensureLanguageRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO language_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

export async function saveAvailableLanguages(languages = []) {
     const db = await getDb();
     const now = Date.now();
     await ensureLanguageRow(db, now);
     await db.runAsync(
          `UPDATE language_state SET
                updated_at = ?,
                languages_json = ?
           WHERE id = ?;`,
          [now, safeStringify(Array.isArray(languages) ? languages : []), ROW_ID]
     );
}

export async function loadAvailableLanguages() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT languages_json FROM language_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.languages_json) ?? [];
}

export async function saveDictionary(dictionary = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLanguageRow(db, now);
     await db.runAsync(
          `UPDATE language_state SET
                updated_at = ?,
                dictionary_json = ?
           WHERE id = ?;`,
          [now, safeStringify(dictionary ?? {}), ROW_ID]
     );
}

export async function loadDictionary() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT dictionary_json FROM language_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.dictionary_json) ?? {};
}

export async function saveAllLanguageData(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureLanguageRow(db, now);

     await db.withTransactionAsync(async () => {
          await db.runAsync(
               `UPDATE language_state SET
                     updated_at = ?,
                     languages_json = ?,
                     dictionary_json = ?
                WHERE id = ?;`,
               [
                    now,
                    safeStringify(Array.isArray(state.languages) ? state.languages : []),
                    safeStringify(state.dictionary ?? {}),
                    ROW_ID,
               ]
          );
     });
}

export async function loadAllLanguageData() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT * FROM language_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) {
          return null;
     }

     return {
          languages: safeParse(row.languages_json) ?? [],
          dictionary: safeParse(row.dictionary_json) ?? {},
          updatedAt: row.updated_at ?? 0,
     };
}

export async function resetLanguageData() {
     const db = await getDb();
     const now = Date.now();
     await db.runAsync(
          `UPDATE language_state SET
                updated_at = ?,
                languages_json = NULL,
                dictionary_json = NULL
           WHERE id = ?;`,
          [now, ROW_ID]
     );
}

