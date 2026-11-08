# Stage 2 — Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working personal library. Save links from the capture bar or the "Add link" button; edit, delete, favourite, cycle status and toggle shelf; filter, search and sort in cards or rows; collections, custom types, tags, reminders, dust, and pick for me. All of it backed by MongoDB.

**Architecture:** New server `items` module (routes → controller → service → schemas) and a `users` module for collections, custom types and shelf. The client `features/library` loads the whole library once (`useItems`) and filters, sorts and counts locally, as the prototype does. Filters live in the URL query string, so the topbar search and the rail's collection and tag links can drive them.

**Tech Stack:** as stage 1 (Bun, Express 5, Mongoose, Zod, React 19, TanStack Query, React Router, Tailwind v4, Vitest).

**Spec:** `docs/superpowers/specs/2026-10-24-second-brain-mern-design.md` · Visual/behaviour reference: `second-brain-bootstrap.html` lines 570–866 and 1145–1240 (helpers, cards, library view, item form).

## Global Constraints

- Everything in stage 1's Global Constraints still applies. Server code uses single quotes (oxfmt); client code uses double quotes (Vite+ fmt).
- Built-in types and copy are exact from the prototype: `article` Article/Articles bi-file-text "read", `video` Video/Videos bi-play-btn "watch", `podcast` Podcast/Podcasts bi-mic "listen", `course` Course/Courses bi-mortarboard "study", `tool` Tool/Tools bi-wrench-adjustable "try". Statuses: `queue` "In queue" bi-circle, `progress` "In progress" bi-circle-half, `done` "Finished" bi-check-circle-fill. Custom type icons: bi-book, bi-newspaper, bi-chat-quote, bi-image, bi-code-slash, bi-music-note-beamed, bi-cart, bi-bookmark.
- Limits: title 1–120, minutes 0–6000, note ≤ 1000, tags ≤ 8 (each lowercased, spaces → `-`, leading `#` stripped), collection name ≤ 30, type name ≤ 20.
- An item always belongs to `req.userId`. Any other user's item id → **404 "Link not found."** (never 403, so ids can't be probed).
- Dust = `status === 'queue'` and saved more than 30 days ago, shown only if `prefs.dust`.

## Rulings (recorded before building)

- R1: Filtering, sorting, counts, tag counts and pick-for-me run on the client over the cached list. `GET /items` takes no filters, and the spec's `/items/pick` and `/items/tags` are dropped. Why: every count on the page needs the full list anyway. Cost if wrong: add query params later.
- R2: Sharing UI (share button, watchlist checkboxes, share avatars) and friend activity data wait for stage 3. Friend activity shows the prototype's empty note.
- R3: `customTypes` drops `color`. The prototype gives every custom type `--t-custom`.
- R4: The auth endpoints and `GET /users/me` return `toSelf(user)` = public user + `shelf`, `collections`, `customTypes`. `toPublicUser` stays for other people's views.

## Review Focus

1. Another user's item id on GET/PATCH/DELETE → 404, never their data. Test in Task 1.
2. Deleting an item also removes it from `user.shelf` (no dangling ids). Test in Task 1.
3. `PUT /users/me/shelf` with an id that isn't yours, or a duplicate → 400. Test in Task 2.
4. Adding a collection or type that differs only by case returns the existing one instead of creating a duplicate. Test in Task 2.
5. The reminder time picked in local time round-trips without shifting hours. Test in Task 3 (`toLocalInput`/`fromLocalInput`).

---

### Task 1: Item model and items API

**Files:** Create `server/src/models/Item.ts`, `server/src/modules/items/{items.routes,items.controller,items.service,items.schemas,items.test}.ts`, `server/src/lib/types.ts`; modify `server/src/app.ts`.

**Interfaces:**
- `BUILTIN_TYPES = ['article','video','podcast','course','tool'] as const` in `lib/types.ts`.
- `Item` fields per spec §4.4 (minus `fromShare` until stage 3); `remindAt: Date | null`; timestamps. `toItemJson(doc) → { id, url, title, type, tags, mins, status, fav, note, coll, remindAt, savedAt }` (savedAt = createdAt ISO).
- `GET /api/items` → `{ items }`, newest first. `POST /api/items` (body: url, title, type, tags?, mins?, note?, coll?, remindAt?) → 201 `{ item }`. `PATCH /api/items/:id` (any subset + `status`, `fav`) → `{ item }`. `DELETE /api/items/:id` → 204, also `$pull` from `user.shelf`.
- The service rejects a `type` that is neither built-in nor one of the user's `customTypes[].key` → 400 `fields.type = 'Pick a type.'`. URL must be http(s) → `fields.url = 'Enter a full link that starts with https://'`.

- [ ] Tests: create → list contains it with `savedAt`; tags normalised (`'#Deep Work'` → `'deep-work'`), max 8; bad url 400; unknown type 400; PATCH status/fav; other user's id GET-by-patch/DELETE → 404 "Link not found."; DELETE pulls id from shelf; unauthenticated → 401.
- [ ] Run `bun run test` → FAIL. Implement. Run → PASS.

### Task 2: Users module — me, collections, custom types, shelf

**Files:** Create `server/src/modules/users/{users.routes,users.controller,users.service,users.schemas,users.test}.ts`; modify `server/src/models/User.ts` (add `toSelf`, drop `color`), the auth controller (return `toSelf`), `app.ts`.

**Interfaces:**
- `GET /api/users/me` → `{ user: toSelf }`.
- `POST /api/users/me/collections {name}` → `{ name, collections }`; case-insensitive match returns the existing name.
- `DELETE /api/users/me/collections/:name` → `{ collections }`; also sets `coll: ''` on the user's items in it.
- `POST /api/users/me/types {label, icon}` → `{ key, customTypes }`. Port `addType`: match a built-in or custom label/plural case-insensitively → return that key; else key `c-<slug>` (append `-2` while taken), label capitalised, plural (`s` kept / consonant+y → `ies` / + `s`), icon falls back to `bi-bookmark` if not in the list.
- `PUT /api/users/me/shelf {ids}` → `{ shelf }`; every id must be the user's item, no duplicates → else 400.

- [ ] Tests: me includes shelf/collections/customTypes; `'weekend reads'` after `'Weekend Reads'` returns `'Weekend Reads'`, one entry; delete collection clears `coll` on items; types: `'Book'` → `c-book`, plural `Books`; `'books'` again → same key; `'Story'` plural `Stories`; `'video'` → `video`; bad icon → `bi-bookmark`; shelf with a foreign id → 400; shelf ok → saved order.
- [ ] Run → FAIL. Implement. Run → PASS (auth tests still pass).

### Task 3: Client library helpers

**Files:** Create `client/src/lib/url.ts`, `client/src/lib/format.ts`, `client/src/features/library/{types.ts,lib/filter.ts}` with tests next to each.

**Interfaces:**
- `url.ts`: `normUrl(v): string | null`, `bare(u)`, `domain(u)`, `detectType(u): BuiltinType`, `guessTitle(u)` — ported verbatim from prototype lines 643–659.
- `format.ts`: `fmtStamp(iso)`, `fmtDay(iso)`, `rel(iso, now = Date.now())`, `fmtMins(m)`, `plural(n, w)`, `an(w)`, `toLocalInput(iso): string` (for `datetime-local`), `fromLocalInput(v): string | null` (ISO, empty → null).
- `features/library/types.ts`: `Item`, `ItemStatus`, `TypeDef { key, label, plural, icon, verb, custom? }`, `BUILTIN_TYPES: Record<string, TypeDef>`, `STATUS`, `TYPE_ICONS`, `typeDefs(customTypes): Record<string, TypeDef>`.
- `lib/filter.ts`: `Filters { type, status, tag, coll, q, fav, shelf, sort }`, `DEFAULT_FILTERS`, `filterItems(items, f, shelf: string[]): Item[]`, `tagCounts(items): [tag, n][]`, `isDust(item, now)`, `pickPool(items, budget)`.

- [ ] Tests: `detectType` for youtube/spotify/coursera/github/other; `normUrl('example.com/x')` → `https://example.com/x`, `normUrl('nope')` → null; `guessTitle('https://a.com/how-to-do-great-work.html')` → 'How to do great work'; `fmtMins(90)` → '1 h 30 min'; `rel` minutes/hours/yesterday/days; local-input round trip keeps the same wall-clock time; `filterItems` by type, tag, q (matches note/tags/url), fav, shelf, and each sort (`short` puts 0-min last); `tagCounts` order; `pickPool` excludes done and 0-min, budget 0 = any.
- [ ] Run `vp test run` → FAIL. Implement. Run → PASS.

### Task 4: Library data hooks, modal, item form

**Files:** Create `client/src/components/ui/Modal.tsx` (native `<dialog>`), `client/src/features/library/api/items.ts`, `features/library/hooks/{useItems,useItemMutations}.ts`, `features/library/components/{ItemFormProvider,ItemForm,TagInput,ConfirmDelete}.tsx`, `features/library/index.ts`; modify `features/auth/types.ts` (User gains shelf/collections/customTypes), `test/fixtures.ts`, `test/setup.ts` (dialog polyfill for jsdom).

**Interfaces:**
- `useItems(): { items: Item[]; isPending }` (query key `['items']`).
- `useItemMutations()`: `create(input)`, `update(id, patch)`, `remove(id)`, `setShelf(ids)`, `addCollection(name) → name`, `addType(label, icon) → key`. Each updates the `['items']` or `['me']` cache; fav/status/shelf toggles are optimistic.
- `useItemForm(): { openNew(preUrl?: string); openEdit(item); confirmDelete(item) }`, provided by `<ItemFormProvider>` mounted in `AppShell`.
- The ItemForm matches the prototype modal: Link (with duplicate warning "You already saved this as "{title}" on {fmtStamp}."), Name, Type (+ "New type…" box with icon radio group), Collection (+ "New collection…"), Minutes, Tags (Enter/comma add, Backspace removes, "Used before:" suggestions, max 8), Note, "Show on my shelf" switch, Remind me (`datetime-local`). Errors: "Enter a full link that starts with https://", "Give this link a name.", "Give the new type a name.", "Give the new collection a name.". Toasts: "Saved to your library" / "Changes saved" / "Link deleted".
- Delete confirm: title "Delete this link?", text `"{title}" leaves your library and every watchlist it is on.`, button "Delete link".

- [ ] Tests (MSW): new form prefilled from a pasted youtube URL (type Video, guessed name); submitting with empty name shows "Give this link a name."; "New collection…" path POSTs the collection then the item with that `coll`; Backspace in an empty tag input removes the last tag; delete confirm calls DELETE and toasts "Link deleted".
- [ ] Run → FAIL. Implement. Run → PASS.

### Task 5: Library page, cards and right rail

**Files:** Create `features/library/components/{CaptureBar,StatsStrip,Toolbar,ActiveFilters,ItemCard,ItemRow,StatusButton,ItemMenu,PickCard,RemindersCard,FriendActivityCard,TypeChip}.tsx`, `features/library/hooks/useFilters.ts`; rewrite `features/library/pages/LibraryPage.tsx`; modify `components/layout/{Rail,Topbar,AppShell}.tsx`.

**Interfaces:**
- `useFilters(): [Filters, (patch: Partial<Filters>) => void, reset()]` backed by `useSearchParams` (defaults omitted from the URL). Layout `grid|list` lives in `localStorage['sb-layout']` (try/catch).
- Page per prototype `vLibrary`: PageHead "Library" / "Everything you saved, newest first unless you change the order."; capture bar with live hint (default / "That does not look like a full link yet." / "Already in your library: …" / "Looks like a video from youtube.com. Press Enter to name and tag it."); strip (links, in queue, in progress, finished, left to get through); toolbar (type pills with counts, custom types only when used; status select; sort select; Favourites; On my shelf; Reset with toast "Filters and sorting reset"; card/list toggle); active filter chips + "Clear all"; grid or rows; empty state "Nothing matches" / "No saved link fits these filters." + "Clear filters". Right column ≥ xl: PickCard (15 min / 30 min / 1 h / Any, Another, "Start it" → status progress + toast `"{title}" is in progress`), RemindersCard (reminders sorted + dust with "Let it go" → delete confirm), FriendActivityCard (empty note).
- Status button cycles queue → progress → done, toast `Marked as {label lowercased}`. Shelf toggle toasts "On your shelf. Friends can see it." / "Off your shelf. Only you can see it.". Menu: Open link, Edit name, tags and note, Copy link, Delete (Share comes in stage 3).
- Rail adds a Library count, a "Collections" group (each → `/library?coll=…` with count, toggles off when active) and "Top tags" (10). Topbar search writes `q` (navigates to /library); "Add link" is enabled and opens the form.

- [ ] Tests: library renders cards from `/api/items` with type-pill counts; clicking the "Videos" pill shows only videos and sets `?type=video`; status button PATCHes `status: 'progress'`; capture bar on a saved URL shows "Already in your library"; empty filter result shows "Nothing matches"; rail collection link filters.
- [ ] Run → FAIL. Implement. Run → PASS. `vp check` clean.

### Task 6: Docs and end-to-end check

- [ ] Update the spec §4.5 (R1 endpoint changes) and README status ("Stage 2 of 4").
- [ ] `bun run test`, `bun run format:check`, `bunx tsc --noEmit`, `bun run lint` (server); `vp test run`, `vp check`, `vp run build` (client) → all pass.
- [ ] Curl through the proxy: sign up → create item → list → patch → shelf → delete.
