-- DROP TABLE IF EXISTS messages;

-- CREATE TABLE messages (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     message_group TEXT NOT NULL,
--     sender_email TEXT NOT NULL,
--     sender_name TEXT,
--     recipient_email TEXT NOT NULL,
--     recipient_name TEXT,
--     message_content TEXT NOT NULL
-- );

-- DROP TABLE IF EXISTS swap_prefs;

-- CREATE TABLE swap_prefs (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     recipient_email TEXT NOT NULL,
--     message_group_from TEXT NOT NULL,
--     message_group_to TEXT NOT NULL
-- );

-- DROP TABLE IF EXISTS attachments;

-- CREATE TABLE attachments (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     message_group TEXT NOT NULL,
--     attachment TEXT NOT NULL,
--     count INTEGER NOT NULL
-- );

-- DROP TABLE IF EXISTS attachment_prefs;

-- CREATE TABLE attachment_prefs (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     recipient_email TEXT NOT NULL,
--     message_group TEXT NOT NULL,
--     attachment_id INTEGER NOT NULL
-- );

-- DROP TABLE IF EXISTS hidden_card_overrides;

-- CREATE TABLE hidden_card_overrides (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     recipient_email TEXT NOT NULL,
--     message_group TEXT NOT NULL
-- );

-- DROP TABLE IF EXISTS admins;

-- CREATE TABLE admins (
--     id TEXT PRIMARY KEY,
--     write BOOLEAN NOT NULL
-- );

-- DROP TABLE IF EXISTS cp_taps;

-- CREATE TABLE cp_taps (
--     netid TEXT PRIMARY KEY NOT NULL,
--     responded_timestamp TIMESTAMP,
--     tap_name TEXT NOT NULL,
--     accept_tap BOOLEAN,
--     clear_schedule BOOLEAN,
--     wear_clothing BOOLEAN,
--     monitor_inbox BOOLEAN,
--     notes TEXT,
--     pronouns TEXT,
--     phonetic_spelling TEXT,
--     allergens TEXT,
--     physical_accommodations TEXT
-- );

-- DROP TABLE IF EXISTS google_slides_ids;

-- CREATE TABLE google_slides_ids (
--     id INTEGER PRIMARY KEY NOT NULL,
--     message_group TEXT NOT NULL,
--     presentation_id TEXT NOT NULL
-- );


-- LOGS DB

-- DROP TABLE IF EXISTS recently_deleted_messages;

-- CREATE TABLE recently_deleted_messages (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     created_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     deleted_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     message_group TEXT NOT NULL,
--     sender_email TEXT NOT NULL,
--     sender_name TEXT,
--     recipient_email TEXT NOT NULL,
--     recipient_name TEXT,
--     message_content TEXT NOT NULL
-- );

-- DROP TABLE IF EXISTS logs;

-- CREATE TABLE logs (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     log_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     user_email TEXT NOT NULL,
--     user_name TEXT NOT NULL,
--     log_type TEXT NOT NULL,
--     error_code TEXT,
--     log_content TEXT NOT NULL
-- );