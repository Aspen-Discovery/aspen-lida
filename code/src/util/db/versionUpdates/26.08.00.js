export const key = '26.08.00';

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
          CREATE TABLE IF NOT EXISTS user_state (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               user_id INTEGER,
               display_name TEXT,
               cat_name TEXT,
               ils_barcode TEXT,
               cat_username TEXT,
               num_checked_out INTEGER,
               num_overdue INTEGER,
               num_holds INTEGER,
               num_holds_available INTEGER,
               num_lists INTEGER,
               num_saved_searches INTEGER,
               num_saved_searches_new INTEGER,
               num_reading_history INTEGER,
               num_linked_accounts INTEGER,
               num_saved_events_upcoming INTEGER,
               fines TEXT,
               has_year_in_review INTEGER,
               year_in_review_name TEXT,
               last_list_used TEXT,
               hide_soft_delete_list_ui INTEGER,
               hold_sort_unavailable TEXT,
               hold_sort_available TEXT,
               checkout_sort TEXT,
               interface_language TEXT,
               pickup_location_id TEXT,
               home_location_id TEXT,
               alternate_library_card TEXT,
               alternate_library_card_password TEXT,
               remember_hold_pickup_location INTEGER,
               prompt_for_hold_notifications INTEGER,
               profile_json TEXT,
               language TEXT,
               language_display_name TEXT,
               notification_onboard INTEGER,
               expo_token TEXT,
               seen_notification_onboard_prompt INTEGER,
               checkout_sort_method TEXT,
               hold_pending_sort_method TEXT,
               hold_ready_sort_method TEXT,
               preferred_pickup_location_is_valid INTEGER,
               preferred_pickup_location_warning TEXT
          );

          CREATE TABLE IF NOT EXISTS user_accounts (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_viewers (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_lists (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_list_groups (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_locations (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_reading_history (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_saved_events (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_cards (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_notification_settings (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_app_preferences (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_debug_messages (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_notification_history (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_inbox (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

          CREATE TABLE IF NOT EXISTS user_sublocations (
               id INTEGER PRIMARY KEY CHECK (id = 1),
               updated_at INTEGER NOT NULL,
               payload TEXT
          );

           CREATE TABLE IF NOT EXISTS user_saved_searches (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                updated_at INTEGER NOT NULL,
                payload TEXT
           );

           CREATE TABLE IF NOT EXISTS library_branch_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                updated_at INTEGER NOT NULL,
                location_id INTEGER,
                display_name TEXT,
                library_id INTEGER,
                is_main_branch INTEGER,
                solr_scope TEXT,
                scope TEXT,
                self_check_enabled INTEGER,
                location_json TEXT,
                self_check_settings_json TEXT,
                locations_json TEXT
           );

            CREATE TABLE IF NOT EXISTS library_system_state (
                 id INTEGER PRIMARY KEY CHECK (id = 1),
                 updated_at INTEGER NOT NULL,
                 url TEXT,
                 name TEXT,
                 favicon TEXT,
                 library_id INTEGER,
                 version TEXT,
                 languages_json TEXT,
                 local_ill_json TEXT,
                 library_json TEXT,
                 menu_json TEXT,
                 catalog_status INTEGER,
                 catalog_status_message TEXT,
                 home_screen_links_json TEXT,
                 app_settings_json TEXT,
                 app_settings_url_cache TEXT,
                 app_settings_slug_cache TEXT
            );

            CREATE TABLE IF NOT EXISTS browse_category_state (
                 id INTEGER PRIMARY KEY CHECK (id = 1),
                 updated_at INTEGER NOT NULL,
                 categories_json TEXT,
                 max_categories INTEGER
            );

            CREATE TABLE IF NOT EXISTS browse_category_list (
                 id INTEGER PRIMARY KEY CHECK (id = 1),
                 updated_at INTEGER NOT NULL,
                 list_json TEXT
            );
       `);
}
