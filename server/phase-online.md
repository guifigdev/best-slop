Phase Killer uses an independent HTTP API in `phase-rooms.js`, with no Node server or WebSocket requirement. The Worker calls `handlerPhaseRequest(request, env)` first and serves frontend assets when it returns `null`. Bind D1 as `DB` in `.openai/hosting.json` (`"d1":"DB"`, omit `static` for the Worker build).

The schema-only migration and its journal are under `drizzle/`. Copy that directory to the deployment artifact's `dist/.openai/drizzle` (the standard helper does this automatically). Keep applied migration history immutable. The API never creates tables during requests. No account credentials or stored guest capability tokens belong in source files.

API contract, all payloads JSON:

| Method and path | Body / authorization | Response |
| --- | --- | --- |
| POST `/api/phase/create` | `{name,room?}` | 201 `{room,id,token,revision,state}` |
| POST `/api/phase/join` | `{room,name}` | 201 `{room,id,token,revision,state}` |
| GET `/api/phase/:room` | `Authorization: Bearer <token>` | `{room,id,revision,state}` |
| POST `/api/phase/:room/command` | Bearer token, `{command,requestId?}` | `{room,id,revision,state,accepted,message}` |
| POST `/api/phase/:room/leave` | Bearer token, `{}` | `{room,left:true}` |

Commands use the existing simulation's `pk*` command names. Use an 8–64 character alphanumeric/underscore/hyphen `requestId` for retryable commands, particularly chat, item use and combine. Duplicate IDs return their original acceptance without repeating the action. A rejected game action returns HTTP 200 with `accepted:false`; transport/auth/rate errors use an appropriate HTTP error and `{error,message}`. The UI must render names and chat as plain text. Poll every 350–500 ms and back off on 429/503. Avoid overlapping polls, preserve the latest revision and retry 409 briefly with the same request ID. Capabilities are returned only to their creator; store each in its own browser session and send it only in the Authorization header. Never put tokens in URLs, chat, console logs or shared snapshots.

Snapshots always come from `game.snapshotPhaseKiller(authenticatedOwner)`. Canonical state and token hashes stay in D1; the viewer cannot select another owner or mutate raw state. Every mutation and time advance uses a revision compare-and-swap and retry. Rooms expire after two idle hours, hold up to 12 humans, and have per-player poll/action budgets. Leaving a running match gives its character to a bot; leaving the lobby frees the seat. The lobby pauses until players ready, requires at least two humans, and forbids late joins after play begins. Idle matches advance only on authenticated requests, with at most 0.75s catchup per request to avoid a large simulation burst. This is a modest-room polling transport; it is not a high-frequency authoritative server for the other game modes.
