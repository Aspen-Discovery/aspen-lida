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

async function ensureUserStateRow(db, now) {
     await db.runAsync(
          `INSERT OR IGNORE INTO user_state (id, updated_at) VALUES (?, ?);`,
          [ROW_ID, now]
     );
}

// ─── user_state: targeted partial saves ──────────────────────────────────────

/**
 * Saves the full user profile object scalar fields.
 * Called when the user profile API returns fresh data.
 */
export async function saveUserProfile(user = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureUserStateRow(db, now);
     await db.runAsync(
          `UPDATE user_state SET
                updated_at = ?,
                user_id = ?,
                display_name = ?,
                cat_name = ?,
                ils_barcode = ?,
                cat_username = ?,
                num_checked_out = ?,
                num_overdue = ?,
                num_holds = ?,
                num_holds_available = ?,
                num_lists = ?,
                num_saved_searches = ?,
                num_saved_searches_new = ?,
                num_reading_history = ?,
                num_linked_accounts = ?,
                num_saved_events_upcoming = ?,
                fines = ?,
                has_year_in_review = ?,
                year_in_review_name = ?,
                last_list_used = ?,
                hide_soft_delete_list_ui = ?,
                hold_sort_unavailable = ?,
                hold_sort_available = ?,
                checkout_sort = ?,
                interface_language = ?,
                pickup_location_id = ?,
                home_location_id = ?,
                alternate_library_card = ?,
                alternate_library_card_password = ?,
                remember_hold_pickup_location = ?,
                prompt_for_hold_notifications = ?,
                profile_json = ?
           WHERE id = ?;`,
          [
               now,
               numberOrNull(user.id),
               user.displayName ?? null,
               user.cat_name ?? null,
               user.ils_barcode ?? null,
               user.cat_username ?? null,
               numberOrNull(user.numCheckedOut),
               numberOrNull(user.numOverdue),
               numberOrNull(user.numHolds),
               numberOrNull(user.numHoldsAvailable),
               numberOrNull(user.numLists),
               numberOrNull(user.numSavedSearches),
               numberOrNull(user.numSavedSearchesNew),
               numberOrNull(user.numReadingHistory),
               numberOrNull(user.numLinkedAccounts),
               numberOrNull(user.numSavedEventsUpcoming),
               user.fines ?? null,
               boolToInt(user.hasYearInReview),
               user.yearInReviewName ?? null,
               user.lastListUsed ?? null,
               boolToInt(user.hideSoftDeleteListUI),
               user.holdSortUnavailable ?? null,
               user.holdSortAvailable ?? null,
               user.checkoutSort ?? null,
               user.interfaceLanguage ?? null,
               user.pickupLocationId ? String(user.pickupLocationId) : null,
               user.homeLocationId ? String(user.homeLocationId) : null,
               user.alternateLibraryCard ?? null,
               user.alternateLibraryCardPassword ?? null,
               numberOrNull(user.rememberHoldPickupLocation),
               boolToInt(user.promptForHoldNotifications),
               safeStringify(user),
               ROW_ID,
          ]
     );
}

/**
 * Saves session/preference fields that don't come directly from the user profile.
 */
export async function saveUserSettings(settings = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureUserStateRow(db, now);
     await db.runAsync(
          `UPDATE user_state SET
                updated_at = ?,
                language = ?,
                language_display_name = ?,
                notification_onboard = ?,
                expo_token = ?,
                seen_notification_onboard_prompt = ?,
                checkout_sort_method = ?,
                hold_pending_sort_method = ?,
                hold_ready_sort_method = ?
           WHERE id = ?;`,
          [
               now,
               settings.language ?? null,
               settings.languageDisplayName ?? null,
               numberOrNull(settings.notificationOnboard),
               settings.expoToken ? String(settings.expoToken) : null,
               boolToInt(settings.seenNotificationOnboardPrompt),
               settings.userCheckoutSortMethod ?? null,
               settings.userHoldPendingSortMethod ?? null,
               settings.userHoldReadySortMethod ?? null,
               ROW_ID,
          ]
     );
}

/**
 * Saves pickup location validity and warning after the pickup locations API responds.
 */
export async function savePickupLocationPrefs(isValid, warning) {
     const db = await getDb();
     const now = Date.now();
     await ensureUserStateRow(db, now);
     await db.runAsync(
          `UPDATE user_state SET
                updated_at = ?,
                preferred_pickup_location_is_valid = ?,
                preferred_pickup_location_warning = ?
           WHERE id = ?;`,
          [now, boolToInt(isValid), warning ?? null, ROW_ID]
     );
}

/**
 * Saves the most recently used list id for quick reuse in list-related screens.
 */
export async function saveLastListUsed(listId) {
     const db = await getDb();
     const now = Date.now();
     await ensureUserStateRow(db, now);
     await db.runAsync(
          `UPDATE user_state SET
                updated_at = ?,
                last_list_used = ?
           WHERE id = ?;`,
          [now, listId ? String(listId) : null, ROW_ID]
     );
}

// ─── user_state: read ─────────────────────────────────────────────────────────

/**
 * Loads the user state row.
 * Returns null if no row exists yet.
 */
export async function loadUserState() {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT * FROM user_state WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );

     if (!row) return null;

     // Merge: specific columns override anything in profile_json,
     // but profile_json fills in any extra fields not in individual columns.
     const profileJson = safeParse(row.profile_json) ?? {};

     const user = {
          ...profileJson,
          id: row.user_id ?? profileJson.id,
          displayName: row.display_name ?? profileJson.displayName,
          cat_name: row.cat_name ?? profileJson.cat_name,
          ils_barcode: row.ils_barcode ?? profileJson.ils_barcode,
          cat_username: row.cat_username ?? profileJson.cat_username,
          numCheckedOut: row.num_checked_out ?? profileJson.numCheckedOut,
          numOverdue: row.num_overdue ?? profileJson.numOverdue,
          numHolds: row.num_holds ?? profileJson.numHolds,
          numHoldsAvailable: row.num_holds_available ?? profileJson.numHoldsAvailable,
          numLists: row.num_lists ?? profileJson.numLists,
          numSavedSearches: row.num_saved_searches ?? profileJson.numSavedSearches,
          numSavedSearchesNew: row.num_saved_searches_new ?? profileJson.numSavedSearchesNew,
          numReadingHistory: row.num_reading_history ?? profileJson.numReadingHistory,
          numLinkedAccounts: row.num_linked_accounts ?? profileJson.numLinkedAccounts,
          numSavedEventsUpcoming: row.num_saved_events_upcoming ?? profileJson.numSavedEventsUpcoming,
          fines: row.fines ?? profileJson.fines,
          hasYearInReview: intToBool(row.has_year_in_review) ?? profileJson.hasYearInReview,
          yearInReviewName: row.year_in_review_name ?? profileJson.yearInReviewName,
          lastListUsed: row.last_list_used ?? profileJson.lastListUsed,
          hideSoftDeleteListUI: intToBool(row.hide_soft_delete_list_ui) ?? profileJson.hideSoftDeleteListUI,
          holdSortUnavailable: row.hold_sort_unavailable ?? profileJson.holdSortUnavailable,
          holdSortAvailable: row.hold_sort_available ?? profileJson.holdSortAvailable,
          checkoutSort: row.checkout_sort ?? profileJson.checkoutSort,
          interfaceLanguage: row.interface_language ?? profileJson.interfaceLanguage,
          pickupLocationId: row.pickup_location_id ?? profileJson.pickupLocationId,
          homeLocationId: row.home_location_id ?? profileJson.homeLocationId,
          alternateLibraryCard: row.alternate_library_card ?? profileJson.alternateLibraryCard,
          alternateLibraryCardPassword: row.alternate_library_card_password ?? profileJson.alternateLibraryCardPassword,
          rememberHoldPickupLocation: row.remember_hold_pickup_location ?? profileJson.rememberHoldPickupLocation,
          promptForHoldNotifications: intToBool(row.prompt_for_hold_notifications) ?? profileJson.promptForHoldNotifications,
     };

     return {
          updatedAt: row.updated_at,
          user,
          language: row.language,
          languageDisplayName: row.language_display_name,
          notificationOnboard: row.notification_onboard,
          expoToken: row.expo_token ?? false,
          seenNotificationOnboardPrompt: intToBool(row.seen_notification_onboard_prompt),
          userCheckoutSortMethod: row.checkout_sort_method,
          userHoldPendingSortMethod: row.hold_pending_sort_method,
          userHoldReadySortMethod: row.hold_ready_sort_method,
          preferredPickupLocationIsValid: intToBool(row.preferred_pickup_location_is_valid),
          preferredPickupLocationWarning: row.preferred_pickup_location_warning,
     };
}

// ─── Collection table helpers ─────────────────────────────────────────────────

async function upsertCollection(tableName, data) {
     const db = await getDb();
     await db.runAsync(
          `INSERT INTO ${tableName} (id, updated_at, payload) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, payload = excluded.payload;`,
          [ROW_ID, Date.now(), safeStringify(data)]
     );
}

async function fetchCollection(tableName) {
     const db = await getDb();
     const row = await db.getFirstAsync(
          `SELECT payload FROM ${tableName} WHERE id = ? LIMIT 1;`,
          [ROW_ID]
     );
     return safeParse(row?.payload);
}

// ─── Individual table operations ──────────────────────────────────────────────

export const saveAccounts = (data) => upsertCollection('user_accounts', data);
export const loadAccounts = () => fetchCollection('user_accounts');

export const saveViewers = (data) => upsertCollection('user_viewers', data);
export const loadViewers = () => fetchCollection('user_viewers');

export const saveLists = (data) => upsertCollection('user_lists', data);
export const loadLists = () => fetchCollection('user_lists');

export const saveListGroups = (data) => upsertCollection('user_list_groups', data);
export const loadListGroups = () => fetchCollection('user_list_groups');

export const saveLocations = (data) => upsertCollection('user_locations', data);
export const loadLocations = () => fetchCollection('user_locations');

export const saveReadingHistory = (data) => upsertCollection('user_reading_history', data);
export const loadReadingHistory = () => fetchCollection('user_reading_history');

export const saveSavedEvents = (data) => upsertCollection('user_saved_events', data);
export const loadSavedEvents = () => fetchCollection('user_saved_events');

export const saveCards = (data) => upsertCollection('user_cards', data);
export const loadCards = () => fetchCollection('user_cards');

export const saveNotificationSettings = (data) => upsertCollection('user_notification_settings', data);
export const loadNotificationSettings = () => fetchCollection('user_notification_settings');

export const saveAppPreferences = (data) => upsertCollection('user_app_preferences', data);
export const loadAppPreferences = () => fetchCollection('user_app_preferences');

export const saveDebugMessages = (data) => upsertCollection('user_debug_messages', data);
export const loadDebugMessages = () => fetchCollection('user_debug_messages');

export const saveNotificationHistory = (data) => upsertCollection('user_notification_history', data);
export const loadNotificationHistory = () => fetchCollection('user_notification_history');

export const saveInbox = (data) => upsertCollection('user_inbox', data);
export const loadInbox = () => fetchCollection('user_inbox');

export const saveSublocations = (data) => upsertCollection('user_sublocations', data);
export const loadSublocations = () => fetchCollection('user_sublocations');

export const saveSavedSearches = (data) => upsertCollection('user_saved_searches', data);
export const loadSavedSearches = () => fetchCollection('user_saved_searches');

// ─── Combined ─────────────────────────────────────────────────────────────────

const COLLECTION_TABLES = [
     'user_accounts', 'user_viewers', 'user_lists', 'user_list_groups',
     'user_locations', 'user_reading_history', 'user_saved_events', 'user_cards',
     'user_notification_settings', 'user_app_preferences', 'user_debug_messages',
     'user_notification_history', 'user_inbox', 'user_sublocations', 'user_saved_searches',
];

/**
 * Saves all user data in a single database transaction.
 * Used for initial full write on first login.
 */
export async function saveAllUserData(state = {}) {
     const db = await getDb();
     const now = Date.now();
     await ensureUserStateRow(db, now);

     await db.withTransactionAsync(async () => {
          await saveUserProfile(state.user ?? {});
          await saveUserSettings({
               language: state.language,
               languageDisplayName: state.languageDisplayName,
               notificationOnboard: state.notificationOnboard,
               expoToken: state.expoToken,
               seenNotificationOnboardPrompt: state.seenNotificationOnboardPrompt,
               userCheckoutSortMethod: state.userCheckoutSortMethod,
               userHoldPendingSortMethod: state.userHoldPendingSortMethod,
               userHoldReadySortMethod: state.userHoldReadySortMethod,
          });
          await savePickupLocationPrefs(state.preferredPickupLocationIsValid, state.preferredPickupLocationWarning);

          const collections = [
               ['user_accounts', state.accounts],
               ['user_viewers', state.viewers],
               ['user_lists', state.lists],
               ['user_list_groups', state.listGroups],
               ['user_locations', state.locations],
               ['user_reading_history', state.readingHistory],
               ['user_saved_events', state.savedEvents],
               ['user_cards', state.cards],
               ['user_notification_settings', state.notificationSettings],
               ['user_app_preferences', state.appPreferences],
               ['user_debug_messages', state.userDebugMessage],
               ['user_notification_history', state.notificationHistory],
               ['user_inbox', state.inbox],
               ['user_sublocations', state.sublocations],
               ['user_saved_searches', state.savedSearches],
          ];

          for (const [table, data] of collections) {
               await db.runAsync(
                    `INSERT INTO ${table} (id, updated_at, payload) VALUES (?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, payload = excluded.payload;`,
                    [ROW_ID, now, safeStringify(data)]
               );
          }
     });
}

/**
 * Loads all user data from each table in parallel.
 * Returns null if no user_state row exists.
 */
export async function loadAllUserData() {
     const stateRow = await loadUserState();
     if (!stateRow) return null;

     const [
          accounts, viewers, lists, listGroups, locations,
          readingHistory, savedEvents, cards, notificationSettings,
          appPreferences, userDebugMessage, notificationHistory,
          inbox, sublocations, savedSearches,
     ] = await Promise.all([
          loadAccounts(), loadViewers(), loadLists(), loadListGroups(), loadLocations(),
          loadReadingHistory(), loadSavedEvents(), loadCards(), loadNotificationSettings(),
          loadAppPreferences(), loadDebugMessages(), loadNotificationHistory(),
          loadInbox(), loadSublocations(), loadSavedSearches(),
     ]);

     return {
          ...stateRow,
          accounts, viewers, lists, listGroups, locations,
          readingHistory, savedEvents, cards, notificationSettings,
          appPreferences, userDebugMessage, notificationHistory,
          inbox, sublocations, savedSearches,
     };
}

/**
 * Clears all user data across every table.
 */
export async function clearAllUserData() {
     const db = await getDb();
     await db.withTransactionAsync(async () => {
          await db.runAsync(`DELETE FROM user_state WHERE id = ?;`, [ROW_ID]);
          for (const table of COLLECTION_TABLES) {
               await db.runAsync(`DELETE FROM ${table} WHERE id = ?;`, [ROW_ID]);
          }
     });
}
