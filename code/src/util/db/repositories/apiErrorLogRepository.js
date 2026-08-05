import { getDb } from '../sqlite';
import { normalizePage, buildPageMeta } from '../queryUtils';
import { safeStringify } from '../serialize';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Insert a single API error log record.
 * @param {Object} entry
 */
export async function insertApiErrorLog(entry = {}) {
     const now = Date.now();
     let db;
     try {
          db = await getDb();
          await db.runAsync(
               `INSERT INTO api_error_logs (
                    created_at,
                    method,
                    endpoint,
                    status,
                    problem,
                    message,
                    request_url,
                    request_params,
                    request_body,
                    response_body
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
               `,
               [
                    now,
                    entry.method ?? null,
                    entry.endpoint ?? null,
                    entry.status ?? null,
                    entry.problem ?? null,
                    entry.message ?? null,
                    entry.requestUrl ?? null,
                    safeStringify(entry.requestParams),
                    safeStringify(entry.requestBody),
                    safeStringify(entry.responseBody),
               ]
          );
     } catch (error) {
          // Logging failures should never break API calls.
     }
}

/**
 * Delete records older than `hours`.
 * Default is 24h.
 */
export async function purgeExpiredApiErrorLogs(hours = 24) {
     const db = await getDb();
     const cutoff = Date.now() - hours * 60 * 60 * 1000;

     const result = await db.runAsync(
          `DELETE FROM api_error_logs WHERE created_at < ?;`,
          [cutoff]
     );

     return result?.changes ?? 0;
}

/**
 * Fetch paginated API error logs.
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.pageSize
 * @param {boolean} options.last24HoursOnly
 */
export async function getApiErrorLogsPage(options = {}) {
     const db = await getDb();

     const {
          page = 1,
          pageSize = 25,
          last24HoursOnly = true,
     } = options;

     const paging = normalizePage(page, pageSize, 100);
     const cutoff = Date.now() - DAY_MS;

     const whereClause = last24HoursOnly ? 'WHERE created_at >= ?' : '';
     const whereArgs = last24HoursOnly ? [cutoff] : [];

     const items = await db.getAllAsync(
          `
          SELECT
               id,
               created_at,
               method,
               endpoint,
               status,
               problem,
               message,
               request_url,
               request_params,
               request_body,
               response_body
          FROM api_error_logs
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?;
          `,
          [...whereArgs, paging.pageSize, paging.offset]
     );

     const totalRow = await db.getFirstAsync(
          `
          SELECT COUNT(*) AS total
          FROM api_error_logs
          ${whereClause};
          `,
          whereArgs
     );

     const total = totalRow?.total ?? 0;

     return {
          items: Array.isArray(items) ? items : [],
          ...buildPageMeta(paging.page, paging.pageSize, total),
     };
}

/**
 * Count total API error logs, optionally filtering to only those created in the last 24 hours.
 * @param last24HoursOnly
 * @returns {Promise<*|number>}
 */
export async function countApiErrorLogs(last24HoursOnly = true) {
     const db = await getDb();

     if (!last24HoursOnly) {
          const row = await db.getFirstAsync(
               `SELECT COUNT(*) AS total FROM api_error_logs;`
          );
          return row?.total ?? 0;
     }

     const cutoff = Date.now() - DAY_MS;
     const row = await db.getFirstAsync(
          `SELECT COUNT(*) AS total FROM api_error_logs WHERE created_at >= ?;`,
          [cutoff]
     );
     return row?.total ?? 0;
}

/**
 * Delete all API error logs from the database.
 * @returns {Promise<*|number>}
 */
export async function clearApiErrorLogs() {
     const db = await getDb();
     const result = await db.runAsync(`DELETE FROM api_error_logs;`);
     return result?.changes ?? 0;
}