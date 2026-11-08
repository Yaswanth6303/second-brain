# Second Brain — MERN design

Date: 2026-10-24 · Status: approved

## 1. Intent

Rebuild the single-file prototype `second-brain-bootstrap.html` as a real multi-user
MERN application for the FSAD EL project. The prototype is the **functional and visual
spec**: every screen, control, empty state and toast in it should exist in the app, and the
UI should look the same, rebuilt in Tailwind CSS instead of Bootstrap.

Evaluated on: a working app, **layered architecture**, **tests**, **docs and diagrams**.
Deployment is not graded.

## 2. Goals, non-goals, anti-goals

**Goals**
- Feature parity with the prototype (list in §5), backed by MongoDB, between real accounts.
- Clean, explainable layering on the server and the client that holds up in a viva.
- Vitest test suites on both sides; README, ER diagram, architecture diagram, API reference.

**Non-goals**
- Real email delivery. Password reset links are printed to the server console; reminders
  and the "weekly digest" appear only in the in-app bell. (The digest toggle is stored but
  sends nothing; the UI keeps it.)
- Deployment, CI, Docker.
- Fetching page metadata from URLs server-side. Title and type are guessed on the client
  the way the prototype does it (`guessTitle`, `detectType`).
- Real-time push (websockets). Data refreshes on navigation/refocus.

**Anti-goals** (failure even if it works)
- UI that drifts from the prototype's look (colours, fonts, layout, dark mode).
- Fat route files with business logic and Mongoose calls mixed in.
- Using npm/node instead of Bun.

## 3. Constraints (decided by the user)

| Area | Choice |
|---|---|
| Runtime & package manager | **Bun** (existing `bun init` in `server/`, `bun` in `client/`). No npm. |
| Server framework | **Express 5** (already installed), TypeScript |
| Database | **MongoDB 8** via **Mongoose**, local container `mongodb` run with **Podman** (port 27017, auth `root`, `authSource=admin`) |
| Frontend | **React 19 + Vite** (existing `client/` scaffold with vite-plus), TypeScript |
| Styling | **Tailwind CSS**, reproducing the prototype's exact look |
| Password hashing | **bcrypt** |
| Tests | **Vitest** (server and client) |
| Scope | Everything in the prototype |
| Email | Console-logged reset link; in-app reminders only |

## 4. Architecture

### 4.1 Repo layout

```
second-brain/
├─ client/                     React + Vite + Tailwind
├─ server/                     Bun + Express + Mongoose
├─ docs/
│  ├─ architecture.md          Mermaid: system + request flow
│  ├─ er-diagram.md            Mermaid erDiagram of all collections
│  └─ api.md                   endpoint reference
├─ second-brain-bootstrap.html the visual/functional spec (kept)
└─ README.md                   setup, scripts, env, screenshots
```

### 4.2 Server — feature modules, layered inside

```
server/src/
├─ index.ts                 boot: connect Mongo, start app
├─ app.ts                   build Express app (exported for tests)
├─ config/env.ts            read + validate env (PORT, MONGO_URI, JWT_SECRET, CLIENT_ORIGIN)
├─ db/connect.ts
├─ middleware/
│  ├─ auth.ts               requireAuth: verify JWT cookie → req.userId
│  ├─ validate.ts           validate(zodSchema) for body/query/params
│  └─ error.ts              notFound + central error handler
├─ lib/
│  ├─ http-error.ts         HttpError(status, message)
│  └─ async.ts              (only if Express 5 async handling is insufficient)
├─ modules/
│  ├─ auth/       auth.routes.ts · auth.controller.ts · auth.service.ts · auth.schemas.ts
│  ├─ users/      profile, prefs, shelf order, custom types, collections, stats, export, delete
│  ├─ items/      library CRUD, filters, pick-for-me, reminders
│  ├─ friends/    requests, accept/decline, remove, friend's shelf, watchlist progress
│  ├─ groups/     CRUD, members, group watchlist
│  ├─ shares/     share/unshare an item, recipient progress (seen/done/react)
│  ├─ inbox/      received links: list, save to library, dismiss
│  └─ notifications/  derived bell feed
└─ models/        User.ts · Item.ts · Friendship.ts · Group.ts · Share.ts · InboxEntry.ts
```

Each module's layers have one job:
- **routes**: URL + middleware chain (`requireAuth`, `validate(schema)`) → controller.
- **controller**: unwraps `req`, calls the service, shapes the HTTP response. No Mongoose.
- **service**: business rules and authorization ("is this my item", "are we friends",
  "does their `who` pref allow me to send"). The only layer that touches models.
- **schemas**: Zod schemas for request validation. Types are inferred from them.
- **models**: Mongoose schemas + indexes.

Errors: services throw `HttpError`; the central handler maps it (plus Zod and Mongoose
validation/duplicate-key errors) to `{ error: { message, fields? } }` with the right status.

### 4.3 Auth

- Sign up / log in → bcrypt hash (cost 10) → JWT (`sub` = userId, 7-day expiry) set as an
  **httpOnly, SameSite=Lax cookie**. `GET /api/auth/me` restores the session on reload.
- Forgot password → random token, its SHA-256 hash and a 1-hour expiry stored on the user;
  the reset URL `CLIENT_ORIGIN/reset/:token` is `console.log`ged. The response is the same
  whether or not the email exists. A successful reset sets `passwordChangedAt`; `requireAuth` rejects
  tokens issued before it, so other devices are logged out.
- Logout clears the cookie. Delete account removes the user and cascades (items, shares,
  inbox entries, friendships, group memberships; groups they own are deleted).
- Dev: Vite proxies `/api` → server, so cookies are same-origin; CORS is set for
  `CLIENT_ORIGIN` anyway.

### 4.4 Data model (MongoDB)

```
User
  _id, name, handle (unique, lowercase), email (unique, lowercase), passwordHash,
  bio, hue (0-359, avatar colour), createdAt
  prefs: { who: 'friends'|'anyone'|'nobody', status: bool, pub: bool, digest: bool, dust: bool }
  shelf: [ItemId]                 ordered; position = shelf order
  collections: [string]
  customTypes: [{ key, label, plural, icon }]
  notificationsSeenAt?
  resetTokenHash?, resetExpires?

Item                               (one user's saved link)
  _id, owner → User, url, title, type (built-in key or custom key), tags [string],
  mins (0 = unknown), status: 'queue'|'progress'|'done', fav, note, coll, remindAt?,
  fromShare? → Share              (set when saved from the inbox)
  createdAt (= savedAt), updatedAt
  index: { owner, createdAt }, { owner, tags }, text index on title/note/url/tags

Friendship
  _id, requester → User, recipient → User, status: 'pending'|'accepted', acceptedAt?,
  pair (both ids sorted, unique), createdAt

Group
  _id, owner → User, name, desc, members [User] (owner included), createdAt

Share                              (sender's view: "who did I give this to, did they finish")
  _id, item → Item, from → User, kind: 'friend'|'group',
  toUser? → User, toGroup? → Group, msg, createdAt
  url, title, type, mins           (copy of the link, shown to recipients)
  seen: 'new'|'opened'|'done', seenAt?   (friend shares)
  done: [{ user, at }]             (group shares: members who finished, and when)
  react: string                    (recipient's reaction when finishing)

InboxEntry                         (recipient's view; one per recipient, fan-out for groups)
  _id, recipient → User, share → Share, from → User,
  state: 'new'|'saved'|'dismissed', createdAt
  (deleting the item deletes its shares and their inbox entries: it "leaves every watchlist")
```

Rules from the prototype that the services enforce:
- Sharing to a friend requires an accepted friendship **and** the recipient's `prefs.who`
  to allow it. Sharing to a group requires membership.
- "Save" from the inbox creates an Item in the recipient's library and marks the entry
  `saved`; opening/finishing that item updates the original Share's `seen`/`done`.
- **Recipient progress (user decision)**: clicking a link in the inbox marks the Share
  `opened` (`POST /inbox/:id/open`). Saving creates the Item with a back-reference
  `fromShare`; when that Item's status becomes `progress` → `opened`, `done` → `done` (for a
  group share, the user is added to `done`). Setting it to Finished shows an optional
  "What did you think?" box whose text becomes `react`. Only the recipient can change
  progress. This box and the open tracking are new UI not in the prototype, styled to match.
- **Group roles (user decision)**: members can share links to the group, mark them done,
  see every member's name and avatar, and **leave** (`POST /groups/:id/leave`). Only the
  owner can rename, delete, or add/remove members (picked from the owner's friends). If
  the owner leaves, the group is deleted.
- A friend's shelf view returns only items on their `shelf`, in order, and only to friends
  (or anyone if `prefs.pub`). `prefs.status` controls whether friends see your item status.
- Dust: `status = queue` and older than 30 days, shown only if `prefs.dust`.
- Pick for me: random undone item with `mins ≤ budget`; "shuffle" picks another.

### 4.5 REST API (all under `/api`, JSON, auth required unless marked)

```
auth        POST /auth/signup* · /auth/login* · /auth/logout · /auth/forgot* · /auth/reset*
            GET  /auth/me
users       GET/PATCH /users/me · PATCH /users/me/prefs · DELETE /users/me
            GET  /users/me/stats · GET /users/me/export
            PUT  /users/me/shelf            (ordered item ids)
            POST /users/me/collections · DELETE /users/me/collections/:name
            POST /users/me/types
            GET  /users/:handle             (you, a friend, or prefs.pub; else 404; logged-in only)
items       GET  /items                     (whole library; filtering, sorting, tag
                                            counts and pick-for-me run on the client)
            POST /items · GET/PATCH/DELETE /items/:id
friends     GET  /friends (friends, incoming requests, sent requests) · POST /friends/requests {who}
            POST /friends/requests/:id/accept · /decline · DELETE /friends/:userId
            GET  /friends/:userId           (watchlist out/in + shelf)
groups      GET/POST /groups · GET/PATCH/DELETE /groups/:id · POST /groups/:id/leave
shares      POST /shares {itemIds, friends, groups, handles, msg}  (adds; skips existing)
            GET  /shares/sent · DELETE /shares/:id (sender only)
            POST /shares/:id/save (recipient or group member) · PATCH /shares/:id/react
inbox       GET  /inbox · POST /inbox/:id/open · /dismiss
notifications GET /notifications            (derived: due reminders, new inbox, requests)
            POST /notifications/seen
```
`*` = public. Full request/response shapes go in `docs/api.md`.

### 4.6 Client

```
client/src/
├─ main.tsx
├─ app/            App.tsx · router.tsx · providers.tsx (QueryClient, Auth, Theme, Toast)
├─ features/       one folder per server module; each has api/ · components/ · hooks/ ·
│  │               pages/ · types.ts (+ schemas.ts where forms need it) · index.ts
│  ├─ auth/        also AuthContext.tsx (me, login, logout)
│  ├─ library/     items: ItemCard, ItemRow, AddEditItemModal, capture bar, filters,
│  │               right-rail cards (pick, reminders, activity)
│  ├─ shares/      ShareModal, share hooks
│  ├─ inbox/ · friends/ · groups/ · profile/ · notifications/
├─ components/
│  ├─ layout/      AppShell · Rail · Topbar · RightRail
│  └─ ui/          Button, Pill, Chip, Tag, Modal, Dropdown, Toast, Avatar, EmptyState,
│                  Switch, Progress
├─ context/        ThemeContext.tsx (app-wide only)
├─ lib/            api-client.ts (fetch, credentials: 'include', error → throw) ·
│                  url.ts (normUrl, detectType, guessTitle, domain) ·
│                  format.ts (fmtStamp, fmtDay, rel, fmtMins, plural)
├─ styles/         index.css (Tailwind + @theme tokens ported from the prototype :root)
└─ test/           setup.ts · msw handlers
```

- **Feature boundaries (user decision)**: a feature imports another feature only through its
  `index.ts` (e.g. inbox/friends/groups reuse `ItemCard` via `features/library`).
  Tests are colocated as `*.test.ts(x)`.

- **Routing**: React Router; hash-style views in the prototype become real routes
  (`/library`, `/inbox`, `/friends/:id`, `/groups/:id`, `/profile/:tab`).
- **Server state**: TanStack Query (cache, refetch on focus, optimistic toggles for fav /
  status / shelf). **UI state** (filters, layout grid/list, theme) in component state,
  filters mirrored to the URL query string.
- **Styling**: prototype CSS variables become Tailwind v4 `@theme` tokens, so `bg-surface`,
  `text-muted`, `border-line`, `bg-brand` etc. map 1:1. Dark mode uses the same
  `data-theme` / `prefers-color-scheme` rule as the prototype. Fonts: Bricolage Grotesque,
  Instrument Sans, IBM Plex Mono. Icons: `bootstrap-icons` (same glyphs as the prototype).
  Bootstrap's modal, dropdown and offcanvas are replaced by small accessible React
  components (focus trap, Esc to close, `aria-*` kept from the prototype).

## 5. Feature checklist (parity with the prototype)

- **Auth**: log in, sign up with password strength meter, forgot/reset, show-password
  toggle, log out.
- **Library**: capture bar (paste link → detect type & title), grid/list layouts, filter by
  type pills with counts, status, tag, collection, favourites, on-shelf, search, sort
  (newest, oldest, shortest, A–Z), reset, active-filter chips; item card/row with status
  cycle, fav, shelf toggle, share, menu (edit, copy, delete); add/edit modal (url, name,
  type, custom type with icon + colour, minutes, collection or new collection, tags,
  note, remind me, show on shelf, share to friends/groups).
- **Right rail**: Pick for me (time budget pills, shuffle), Reminders + dust ("let it go"),
  Friend activity.
- **Inbox**: received links, save to library, dismiss, unread count in rail.
- **Friends**: list with watchlist progress, requests in/out, accept/decline, add by
  username or email, invite link, remove friend; friend page tabs (links I sent with
  seen status, links they sent, their shelf with type filter / sort / favourites).
- **Groups**: create/edit/delete, members, group watchlist with per-member done.
- **Shelf**: put on/take off, reorder, "see it as a friend" preview.
- **Profile**: overview stats (what you save about, when you save, time on your shelf,
  give and take), edit profile (name, username, email, bio, avatar hue), settings
  (who can send me links, show status, public shelf, weekly digest, dust flag), export
  library as JSON, delete account.
- **Global**: notifications bell, theme toggle, toasts, account menu, mobile off-canvas rail.

## 6. Testing (Vitest)

- **Server**: Vitest + Supertest against `app.ts`, using the Podman Mongo test database
  (`MONGO_URI_TEST`), cleared between tests. Unit tests for services' rules (share permissions, pick
  logic, dust, inbox save → share progress). Integration tests per module for the happy
  path + auth/validation/permission failures.
- **Client**: Vitest + React Testing Library + jsdom. Unit tests for `lib/` helpers
  (`normUrl`, `detectType`, `guessTitle`, filtering/sort), component tests for the capture
  bar, item card actions, add-item modal validation, auth forms. API mocked with MSW.
- Run with `bun run test` in each package (`bunx vitest`).

## 7. Docs

- `README.md`: what it is, stack, prerequisites (Bun, MongoDB), `.env` example, scripts,
  folder map, screenshots.
- `docs/architecture.md`: Mermaid system diagram (React ↔ Express ↔ MongoDB) and a
  sequence diagram of one request through route → middleware → controller → service →
  model.
- `docs/er-diagram.md`: Mermaid `erDiagram` of §4.4.
- `docs/api.md`: every endpoint, auth, body, response, errors.

## 8. Calls made by Claude (please check)

- Express request validation with **Zod**; **TanStack Query** for client data; **React
  Router** for routing; **Tailwind v4** with `@theme` tokens; **bootstrap-icons** kept for
  identical icons.
- JWT in an httpOnly cookie rather than localStorage.
- Notifications are **derived** on request, not stored.
- Shares keep a copy of the link details; deleting the item removes its shares and inbox
  entries (stage 3 plan R1–R3).
- Tests run against the same Podman Mongo, in a separate `second-brain-test` database (`MONGO_URI_TEST`), dropped per test file (user decision: local Podman Mongo).
- `prefs.who`: **friends** = only friends can share to you directly; **anyone** = any user
  can share to you by typing your username in the share modal (lands in your inbox like a
  friend share); **nobody** = no direct shares. Group shares always reach members (joining
  a group is consent).
- Removing a friend deletes direct shares and unhandled (`new`) inbox entries in **both**
  directions; links already saved to a library stay. Group memberships are untouched.
- Bell unread dot: `User.notificationsSeenAt`; opening the bell sets it, and the dot shows
  if anything in the feed is newer.
- Seed script (`bun run seed`) recreating the prototype's demo users and links, so the
  demo looks like the prototype from the first run.

## 9. Left to the builder

Exact component breakdown, Tailwind class choices that reproduce the prototype pixel-for-pixel,
index tuning, file-level naming inside modules, and the order of implementation (suggested:
server foundation + auth → items → client shell + library → social modules → profile →
docs).
