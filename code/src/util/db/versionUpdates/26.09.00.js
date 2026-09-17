export const key = '26.09.00';

/**
 * Creates persistent storage for the AspenLiDA multi-theme catalog.
 * Unlike theme_state (a single "currently applied" theme), theme_catalog holds one row
 * per theme available at a location, fetched from getAspenLiDAThemesByLocation, so the
 * app can offer a theme switcher without re-fetching from the network.
 *
 * Also adds location_id to theme_state so the currently-applied theme can be tied to the
 * location it was fetched for - without it, switching locations could leave a stale theme
 * from the previous location looking "valid" simply because some themeId was stored.
 * @param db
 * @returns {Promise<void>}
 */
export async function up(db) {
     await db.execAsync(`
          CREATE TABLE IF NOT EXISTS theme_catalog (
               location_id INTEGER NOT NULL,
               theme_id INTEGER NOT NULL,
               updated_at INTEGER NOT NULL,
               weight INTEGER,
               name TEXT,
               base_mode TEXT,
               logo TEXT,
               header_json TEXT,
               primary_json TEXT,
               secondary_json TEXT,
               tertiary_json TEXT,
               PRIMARY KEY (location_id, theme_id)
          );

          ALTER TABLE theme_state ADD COLUMN location_id INTEGER;
          ALTER TABLE theme_state ADD COLUMN header_json TEXT;
       `);
}
