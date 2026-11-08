# API reference

Base URL: `/api` (the Vite dev server proxies it to `http://localhost:4000`). Bodies are JSON. 🔒 means the endpoint needs the `sb_token` cookie; without it you get **401** `"Log in to continue."`.

**Errors** always look like `{ "error": { "message": string, "fields"?: { [field]: string } } }`:

| Status | When |
|---|---|
| 400 | Validation failed (`fields` names each bad field), or the body is not valid JSON |
| 401 | Not logged in, bad or expired cookie, or wrong email/password |
| 403 | Not allowed: someone who takes no links, or a group action only the owner may do |
| 404 | Not found **or not yours**. Other people's ids get the same answer, so they can't be probed. |
| 409 | Username or email already taken (`fields.handle` / `fields.email`) |
| 429 | Too many attempts: login (10 per 15 min per address and email), forgot (5 per 15 min per email), reset (10 per 15 min per address) |

Shapes used below:
- **User (self):** `{ id, name, handle, email, bio, hue, prefs: { who, status, pub, digest, dust }, createdAt, shelf: id[], collections: string[], customTypes: { key, label, plural, icon }[] }`
- **Person** (anyone else): `{ id, name, handle, bio, hue }`
- **Item:** `{ id, url, title, type, tags, mins, status, fav, note, coll, remindAt, savedAt, fromShare }`

## Health

| | |
|---|---|
| `GET /health` | `{ ok: true }` |

## Auth — `/auth`

| Endpoint | Body | Response |
|---|---|---|
| `POST /signup` | `{ name, handle (3–20 a-z 0-9 _ . , lowercased), email, password (≥ 8) }` | 201 `{ user }` + cookie · 409 on taken handle or email |
| `POST /login` | `{ email, password, remember? = true }` | `{ user }` + cookie (a session cookie if `remember` is false) · 401 "Email or password is wrong." |
| `POST /logout` | — | 204, clears the cookie |
| `POST /forgot` | `{ email }` | Always `{ ok: true }`. The reset link is printed to the server console. |
| `POST /reset` | `{ token, password }` | `{ user }` + cookie; older sessions stop working · 400 "This reset link has expired. Ask for a new one." |
| 🔒 `GET /me` | — | `{ user }` |

## Users — `/users` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /me` | — | `{ user }` |
| `PATCH /me` | any of `{ name, handle, email, bio (≤ 140), hue (0–359; the app offers 168, 212, 262, 330, 12, 38), currentPassword }` | `{ user }` · changing the email needs `currentPassword` (400 `fields.currentPassword` otherwise) · 409 on a taken handle or email (nothing saved) |
| `PATCH /me/prefs` | any of `{ who: friends\|anyone\|nobody, status, pub, digest, dust }` | `{ user }` |
| `GET /me/export` | — | `{ exportedAt, user, items }` |
| `DELETE /me` | — | 204. Removes the account and everything that points at it, and clears the cookie. |
| `POST /me/collections` | `{ name (≤ 30) }` | `{ name, collections }`. A name that differs only by case is reused. |
| `DELETE /me/collections/:name` | — | `{ collections }`. Its links get `coll: ""`. |
| `POST /me/types` | `{ label (≤ 20), icon }` | `{ key, customTypes }`. Reuses a matching built-in or custom type; otherwise the key is `c-<slug>`. |
| `PUT /me/shelf` | `{ ids: itemId[] }` (in shelf order) | `{ shelf }` · 400 if an id isn't yours or appears twice |
| `GET /:handle` | — | `{ user: Person, since, shelf }` if it's you, a friend, or `prefs.pub` is on; otherwise 404 "Profile not found." |

## Items — `/items` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /` | — | `{ items }`, newest first (the client filters, sorts and counts) |
| `POST /` | `{ url (http/https), title (1–120), type, tags? (≤ 8, normalised), mins? (0–6000), note? (≤ 1000), coll?, remindAt? (ISO or null) }` | 201 `{ item }` · 400 `fields.type` "Pick a type." for an unknown type |
| `PATCH /:id` | any create field plus `status`, `fav` | `{ item }`. Only the fields sent change. If the link was saved from a share, the status change updates the sender's view. |
| `DELETE /:id` | — | 204. Also removes it from the shelf and from every watchlist and inbox. |

## Friends — `/friends` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /` | — | `{ friends: [{ user, since, sent, done, received }], requests: [{ id, user }], sent: [{ id, user }] }` |
| `POST /requests` | `{ who }` (`@handle`, `handle` or email) | 201 `{ id, user }`, or 200 `{ friend: true, user }` if they had already asked you · 404 / 400 "That's you." / 409 |
| `POST /requests/:id/accept` | — | `{ friend: true, user }` (recipient only) |
| `POST /requests/:id/decline` | — | 204 (recipient only) |
| `GET /:userId` | — | `{ user, since, watchlist: [{ id, item, at, seen, react }], received: InboxEntry[], shelf }` (friends only) |
| `DELETE /:userId` | — | 204. Also deletes direct shares and their inbox entries, both ways. |

## Shares — `/shares` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `POST /` | `{ itemIds, friends?, groups?, handles?, msg? (≤ 280) }` | 201 `{ shares }`. Skips targets that already have the link (a unique index keeps this true even for simultaneous requests). Direct shares need a friendship or the recipient's `who: anyone`; `who: nobody` → 403. |
| `GET /sent` | — | `{ shares: [{ id, item, title, kind, to, seen, seenAt, done: [{ user, at }], react, at }] }` |
| `DELETE /:id` | — | 204 (sender only); its inbox entries go too |
| `POST /:id/save` | — | `{ item }`. Recipient or group member only. Saves once per URL, with tag `from-<name>` and the message as the note. |
| `PATCH /:id/react` | `{ react (≤ 280) }` | 204. Only the recipient of a direct share. |

## Inbox — `/inbox` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /` | — | `{ entries: [{ id, shareId, from, group, url, title, type, mins, msg, at, state }] }` without dismissed ones |
| `POST /:id/open` | — | 204. Marks a direct share "opened" for the sender, if your settings allow it. |
| `POST /:id/dismiss` | — | 204 |

## Groups — `/groups` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /` | — | `{ groups: [{ id, name, desc, owner, members, links }] }` |
| `POST /` | `{ name (1–40), desc? (≤ 90), members: friendIds (≥ 1) }` | 201 `{ group }` |
| `GET /:id` | — | `{ group, watchlist: [{ shareId, from, url, title, type, mins, msg, at, done, mine, saved }] }` (members only) |
| `PATCH /:id` | any of `{ name, desc, members }` | `{ group }`. Owner only (403 otherwise). Newly added members must be the owner's friends. |
| `DELETE /:id` | — | 204. Owner only. Deletes the group's shares and inbox entries. |
| `POST /:id/leave` | — | 204. If the owner leaves, the group is deleted. |

## Notifications — `/notifications` 🔒

| Endpoint | Body | Response |
|---|---|---|
| `GET /` | — | `{ items: [{ kind: request\|inbox\|opened\|finished\|reminder, at, text, link }], unseen }`, newest 10 |
| `POST /seen` | — | 204 |
