# Stage 4 — Profile, Shelf, Settings and Wrap-up — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The profile page (reader card; Overview, Shared with and Settings tabs; "See it as a friend"), the shelf editor and shelf drawing, settings and account actions, a public-ish profile shelf, a demo seed script, and the final docs. Plus a pass over the deferred minor issues.

**Architecture:** The server `users` module grows profile, prefs, export, delete-account and `/users/:handle` endpoints. The client `features/profile` gets the pages and charts; the shelf drawing lives in `features/library` (`Shelf`) so the friend page can reuse it. Stats are computed on the client from data already cached (items, friends, sent shares).

**Spec:** `docs/superpowers/specs/2026-10-24-second-brain-mern-design.md` §5 (Profile, Shelf), §7 (Docs) · Reference: `second-brain-bootstrap.html` lines 980–1135 (reader card, shelf, charts, tabs, settings) and CSS lines 212–273.

## Global Constraints

- Everything from stages 1–3 still applies.
- **Copy (exact, from the prototype):**
  - Tabs: Overview / Shared with / Settings.
  - Card actions: Edit profile / Choose my shelf / See it as a friend / Copy profile link.
  - Shelf card: "Your shelf", "{n} of {m link(s)}. Friends see only these, in this order. Everything else stays private.", "Choose what is on it".
  - Shelf editor: "Choose what is on your shelf"; "Add all favourites", "Add all finished", "Clear the shelf"; "On your shelf", "Private, not on your shelf"; "Save shelf". Toasts "{n link(s)} on your shelf" / "Your shelf is empty".
  - Charts: "Time on your shelf", "When you save", "Give and take", "What you save about".
  - Settings:
    - "Profile" (Full name, Username, Email, Bio ≤ 140, Card colour, Save profile, toast "Profile saved");
    - "Sharing and privacy" ("Who can send me links": Friends only / Anyone who knows my username / Nobody);
    - "Tell friends when I open their links";
    - "Let people who are not friends see my shelf";
    - "Reminders" ("Weekly digest by email", "Flag links older than 30 days");
    - "Your data and account" ("Copy library as JSON", "Log out", "Delete account").
    - A changed pref toasts "Setting saved".
  - Card colours (hues): 168, 212, 262, 330, 12, 38.
- **Account deletion** removes the user and their items, sent shares (and those shares' inbox entries), inbox entries addressed to them, friendships and groups they own. They are also removed from other groups, and the cookie is cleared.

## Rulings (recorded before building)

- R1: `prefs.status` is "Tell friends when I open their links", as the prototype defines it. When it is off, opening, saving or finishing a shared link doesn't update the sender's Opened/Finished. Your shelf always shows status to people allowed to see it. This corrects stage 3, which wired the setting to the shelf.
- R2: The profile link is `/u/{handle}`, a page inside the app for logged-in users. `GET /api/users/:handle` returns the person plus their shelf if you are them, their friend, or they have `prefs.pub` on; otherwise 404. *shortcut: logged-in viewers only; a public no-login page would need its own route and rate limiting.*
- R3: "Stop sharing" in the Shared with tab deletes that target's shares one by one from the client (existing `DELETE /shares/:id`). There's no new endpoint.
- R4: Chart tooltips use the native `title` plus an `aria-label`. The prototype's custom floating tooltip is dropped.
- R5: The weekly digest toggle is stored but sends nothing (no email in this project, per the spec non-goals).
- R6: The seed script (`bun run seed`) only replaces the demo accounts (handles `aarav`, `priyan`, `rohanv`, `sneha.i`, `kabirs`, `meeraj`, `devm`). It never touches other accounts. The demo password is set in the script and documented in the README.

## Review Focus

1. Deleting an account leaves nothing pointing at the user: no inbox entries from or to them, no shares, no friendships, and no memberships in other people's groups. Test in Task 2.
2. `GET /users/:handle` for a stranger with `pub` off → 404, with no hint that the shelf exists. Test in Task 1.
3. Changing the username or email to one that's taken → 409 on that field, with nothing saved. Test in Task 1.
4. With `status` off, the sender never sees Opened/Finished, even after save → done. Test in Task 1.
5. Re-running the seed doesn't duplicate anything and doesn't touch non-demo users. Test in Task 6.

---

### Task 1: Profile, prefs, public profile, status pref

**Files:** `server/src/modules/users/*` (schemas, service, controller, routes, test), `server/src/modules/shares/shares.service.ts` (`recordProgress`), `server/src/modules/inbox/inbox.service.ts` (`openEntry`), `server/src/modules/friends/friends.service.ts` (shelf always shows status).

**Interfaces:**
- `PATCH /api/users/me { name?, handle?, email?, bio? (≤ 140), hue? (one of the 6 hues) }` → `{ user: toSelf }`. The handle and email rules are the same as signup.
- `PATCH /api/users/me/prefs { who?, status?, pub?, digest?, dust? }` → `{ user }`.
- `GET /api/users/:handle` → `{ user: toPerson, since, shelf: [...] }` (shelf shape as on the friend page).
- `GET /api/users/me/export` → `{ exportedAt, user: toSelf, items: toItemJson[] }`.

- [ ] Tests:
  - profile edit saves;
  - taken handle → 409 `fields.handle`, and the name isn't changed either;
  - bad hue → 400;
  - prefs saved;
  - status off → open/progress don't change the share;
  - `/users/:handle`: works for yourself, for a friend, and for a stranger only when `pub` is on (404 otherwise);
  - export has the items.

### Task 2: Delete account

**Files:** the users module; reuse `destroy` from groups (export it).

- `DELETE /api/users/me` → 204, cascade as in Global Constraints, clears the cookie.
- [ ] Test: Alice, with friends, groups, shares, inbox entries and items, deletes her account. Then nothing in any collection references her id, Bob's group no longer lists her, and her cookie gets 401.

### Task 3: Deferred minors

- [ ] Malformed JSON body → 400 "The request body is not valid JSON." (error handler). Test.
- [ ] Reminders for finished links don't notify (notifications query `status: { $ne: 'done' }`). Test.
- [ ] Signup handle: lowercased before the format check on server and client ("Alice" → "alice"). Test.
- [ ] ForgotPage busy state (button disabled while sending). Client test.

### Task 4: Client — shelf drawing, shelf editor, friend shelf

**Files:** `client/src/features/library/components/{Shelf,ShelfEditor}.tsx` (exported), CSS for spines, legend and keys; the friend page shelf tab shows `<Shelf>` above the list.

- `Shelf({ items, defs })`, ported from the prototype `shelf()`:
  - spine width `round(34 + sqrt(min(mins,300)/300) * 40)`;
  - heights article 190 / video 170 / podcast 180 / course 205 / tool 160, otherwise 175;
  - title cap and ellipsis as in the prototype;
  - `sp-{status}` fills;
  - star for favourites;
  - legend with status keys and type keys.
- `ShelfEditor({ onClose })`: modal per prototype `shelfForm`, saved with `setShelf`.
- [ ] Tests: the editor's "Add all favourites" then "Save shelf" PUTs the favourite ids in order and toasts "{n} links on your shelf"; Shelf renders one link per item with an accessible label.

### Task 5: Client — profile page and settings

**Files:** `client/src/features/profile/{api,components,pages}/*`; routes `/profile`, `/profile/:tab`, `/u/:handle`.

- Reader card per prototype `readerCard`:
  - taste line: "Saves mostly #a, #b and #c.", "Finished x of y.", "Shares most with {first}.";
  - slip: Member since / Saved / Finished / On your shelf;
  - actions.
- Overview: shelf card plus four charts (time by type, a 6-week calendar heatmap, give and take, tags that link to `/library?tag=`).
- "See it as a friend" preview bar ("This is what friends see when they open your name in their Friends list: only the links you put on your shelf.", Change the shelf / Back to my view).
- Shared with: a table of targets (Shared with, Type, Links, Finished, Last shared, Open watchlist, Stop sharing → confirm "Stop sharing?" "{name} loses every link you shared. Your library stays as it is." → toast "Stopped sharing with {name}"). Empty state: "You have not shared anything".
- Settings: three cards per prototype. Delete account confirm: "Delete your account?" "Your library, watchlists and groups are removed for good." → logged out, `/signup`.
- `/u/:handle`: reader card (friend view) and shelf; "Profile not found" when 404.
- [ ] Tests: settings prefs change PATCHes and toasts "Setting saved"; profile save with a taken username shows "Already taken." under Username; Shared with "Stop sharing" deletes each share for that target; the calendar shows today.

### Task 6: Seed script

**Files:** `server/src/seed.ts`, `server/package.json` script `seed`, `server/src/seed.test.ts`.

- Export `seed(): Promise<{ users: number; items: number }>`. Data is ported from the prototype: Aarav plus friends Priya, Rohan, Sneha, Kabir and Meera, Dev's pending request, the 13 items with collections, tags, notes, a reminder and the shelf, the 2 groups, shares and inbox entries with seen/done/react, and friends' shelves from their `extra` lists.
- [ ] Test: run twice → same counts, demo handles exist once each; a non-demo user created before is untouched.

### Task 7: Docs and final checks

- [ ] `docs/architecture.md` (Mermaid: system diagram plus a request sequence through the layers), `docs/er-diagram.md` (Mermaid `erDiagram` of User, Item, Friendship, Share, InboxEntry, Group), `docs/api.md` (every endpoint: auth, body, response, errors), README (stage 4 of 4, seed instructions, demo login, docs links).
- [ ] All checks; end-to-end curl of profile edit, prefs, export, `/users/:handle`, delete account.
