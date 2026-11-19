CREATE TABLE phase_rooms (
  room_id TEXT PRIMARY KEY NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX phase_rooms_expires_at_idx ON phase_rooms (expires_at);
