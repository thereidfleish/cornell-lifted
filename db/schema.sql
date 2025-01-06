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