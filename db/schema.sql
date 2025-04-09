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
--     attachment TEXT PRIMARY KEY,
--     count INTEGER NOT NULL
-- );

-- DROP TABLE IF EXISTS attachment_prefs;

-- CREATE TABLE attachment_prefs (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     recipient_email TEXT NOT NULL,
--     message_group TEXT NOT NULL,
--     attachment TEXT NOT NULL
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
--     allergens TEXT
-- );