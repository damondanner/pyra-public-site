CREATE TABLE IF NOT EXISTS public_data (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  document TEXT NOT NULL CHECK (json_valid(document)),
  revision INTEGER NOT NULL CHECK (revision > 0)
);
