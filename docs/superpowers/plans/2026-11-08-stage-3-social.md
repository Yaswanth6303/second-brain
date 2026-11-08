# Stage 3 — Social — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Friends (requests, accept or decline, remove), sharing links to friends, groups or a username, an inbox with opened/finished tracking and reactions, groups (create, edit, leave, delete), the notifications bell and friend activity. Built between real accounts.

**Architecture:** New server modules `friends`, `shares`, `inbox`, `groups` and `notifications` (routes → controller → service → schemas), with new models `Friendship`, `Share`, `InboxEntry` and `Group`. Authorization rules live only in services. The client gets matching `features/*` folders. The library card gains share avatars and a share button. The item form gains the watchlist picker.

**Spec:** `docs/superpowers/specs/2026-10-24-second-brain-mern-design.md` §4.4–4.5 and the stage 3 decisions in §8 · Reference: `second-brain-bootstrap.html` lines 867–1000 (views) and 1236–1366 (share, pick and group forms, actions).

## Global Constraints

- Everything from stages 1–2 still applies (Bun, single quotes on the server and double on the client, 404 for anything not yours, Zod at the edge).
- **Who can share to whom:**
  - **Direct shares:** need an accepted friendship, or the recipient's `prefs.who === 'anyone'`, which lets someone share to them by username.
  - **`who === 'nobody'`:** blocks every direct share. Error: 403 "@{handle} is not taking links right now."
  - **Group shares:** need membership. They reach every other member whatever their `who` setting.
- **Group roles:**
  - Members can share to the group, save, mark done, see every member, and leave.
  - Only the owner can rename, change the description, add or remove members, or delete the group. Members are added only from the owner's friends.
  - When the owner leaves, the group is deleted.
- **Removing a friend:** deletes direct shares in both directions and their inbox entries. Items already saved stay. Group memberships stay.
- **Deleting an item:** deletes its shares and all their inbox entries ("leaves every watchlist it is on").
- **Copy (exact, from the prototype):**
  - Toasts: "Request sent to {who}", "{name} is now a friend", "Request declined", "{name} removed", "Dismissed", "Saved to your library", "Added {n link(s)} to {label}", "Pick at least one link", "Removed from watchlist", "On {n watchlist(s)} now", "No longer shared with anyone", "Group created", "Group saved", "Group deleted", "Pick at least one member", "Add a friend before you create a group".
  - Inbox subtitle: "{n new link(s)} from friends and groups." / "You are all caught up."
  - Seen states: "Not opened" / "Opened" / "Finished".

## Rulings (recorded before building)

- R1: The `Share` keeps a snapshot of the link (`url, title, type, mins`). `InboxEntry` references the share (no copy). Deleting the item deletes its shares and entries. Why: matches the prototype's delete text; one copy instead of two.
- R2: Group "finished" is `done: [{ user, at }]` instead of `[User]`, so friend activity can say when. Direct shares get `seenAt`.
- R3: Sharing is `POST /shares` (add to targets) plus `DELETE /shares/:id` (remove one). The spec's "set exactly" `PUT /items/:id/shares` is dropped. The share modal sends the difference.
- R4: No public share link and no invite link. The design has no public pages.
- R5: The friend's shelf tab is a list with type pills, sort and favourites. The decorative shelf drawing comes in stage 4.
- R6: Notifications are derived on request:
  - incoming friend requests;
  - new inbox entries;
  - your links friends opened or finished (with their reaction);
  - your reminders due within 7 days or overdue.
  The dot shows when any of these is newer than `notificationsSeenAt`. Reminders always count as new until they pass.

## Review Focus

1. A non-member cannot read a group, share to it, or save from it → 404. Test in Task 4.
2. Sharing to a non-friend whose `who` is `friends` or `nobody` → 403 or 404, and nothing lands in their inbox. Test in Task 2.
3. Only the recipient can react to a share or change its progress; the sender can't fake "finished". Test in Task 3.
4. Removing a friend leaves no inbox entry or direct share between the two in either direction. Test in Task 1.
5. Saving the same shared link twice doesn't create two library items. Test in Task 3.

---

### Task 1: Friendships

**Files:** `server/src/models/Friendship.ts`, `server/src/modules/friends/{routes,controller,service,schemas,test}.ts` (named `friends.*.ts`), mounted at `/api/friends`.

**Interfaces:**
- `Friendship { requester, recipient, status: 'pending'|'accepted', createdAt }`, with a unique index on `pair` (the two ids sorted and joined).
- `friendIds(userId): Promise<string[]>` (exported for other services). `areFriends(a, b): Promise<boolean>`.
- `GET /api/friends` → `{ friends: [{ user, since, sent, done, received }], requests: [{ id, user }], sent: [{ id, user }] }`. Here `user` = `toPublicUser`; `sent`/`done` count my direct shares to them; `received` counts their entries to me that aren't dismissed.
- `POST /api/friends/requests { who }`. `who` is a handle (with or without `@`) or an email.
  - Responses: 201 `{ id, user }`; 404 "No one with that username or email."; 400 "That's you."; 409 "You are already friends." / "You already sent a request.".
  - If they had already asked you, the request is accepted instead: 200 `{ friend: true, user }`.
- `POST /api/friends/requests/:id/accept|decline`: recipient only, else 404.
- `DELETE /api/friends/:userId`: removes the friendship plus the cleanup in Global Constraints.
- `GET /api/friends/:userId` → `{ user, since, watchlist, received, shelf }`:
  - `watchlist` = my shares to them: `{ id, item snapshot, at, seen, react }`.
  - `received` = their entries to me (inbox row JSON).
  - `shelf` = their shelf items in order. `status` is hidden unless their `prefs.status`.
  - 404 unless you are friends.

- [ ] Tests: request by handle and by email; self 400; duplicate 409; reverse request auto-accepts; only the recipient can accept; list shapes and counts; remove cleans both directions (Review Focus 4); a friend page for a non-friend → 404; the shelf hides status when `prefs.status` is false.

### Task 2: Shares

**Files:** `server/src/models/Share.ts`, `server/src/modules/shares/*`, mounted at `/api/shares`; modify `items.service.ts` (delete cascade), `models/Item.ts` (`fromShare`), and `toItemJson` (adds `fromShare`).

**Interfaces:**
- `Share { item, from, kind: 'friend'|'group', toUser?, toGroup?, url, title, type, mins, msg, seen: 'new'|'opened'|'done', seenAt?, done: [{user, at}], react, createdAt }`.
- `POST /api/shares { itemIds, friends?: userIds, groups?: groupIds, handles?: string[], msg? }` → 201 `{ shares }`.
  - Skips targets the item is already shared with.
  - Creates one `InboxEntry` per recipient. For a group, that's every member except the sender.
  - Errors: 404 for unknown items/targets; 403 per Global Constraints.
- `GET /api/shares/sent` → `{ shares: [{ id, item, kind, to: {id, name, hue, handle?}, seen, seenAt, done: [{user, at}], react, at }] }`. `user` here is a public user.
- `DELETE /api/shares/:id`: sender only. Also deletes its inbox entries.

- [ ] Tests: share to a friend → their inbox has it; share to a group → every other member gets one; share by handle to an `anyone` user works but to a `friends` user is 404 "No one with that username."; `nobody` → 403; duplicate share skipped; sent list; delete by the sender only; deleting the item removes shares and entries.

### Task 3: Inbox, saving and progress

**Files:** `server/src/models/InboxEntry.ts`, `server/src/modules/inbox/*`, mounted at `/api/inbox`; add `POST /shares/:id/save` and `PATCH /shares/:id/react` to shares; progress hook in `items.service.updateItem`.

**Interfaces:**
- `InboxEntry { recipient, share, state: 'new'|'saved'|'dismissed', createdAt }`.
- `GET /api/inbox` → `{ entries: [{ id, shareId, from: user, group?: {id, name}, url, title, type, mins, msg, at, state }] }`, newest first, without dismissed ones.
- `POST /api/inbox/:id/open` → sets the share's `seen: 'opened'` if it was `'new'` (friend shares). 204.
- `POST /api/inbox/:id/dismiss` → 204.
- `POST /api/shares/:id/save`:
  - Allowed for the share's recipient or a member of its group.
  - Creates an item if the URL isn't already in the library:
    - `tags: ['from-' + sender first name lowercased]`;
    - `note: msg ? "{First}: {msg}" : ''`;
    - `type`: kept if it's built-in, otherwise `'article'`;
    - `fromShare`.
  - If the URL is already saved, sets `fromShare` on that item when it has none.
  - Marks your inbox entry `saved`, creating it if a later member saves from the group page.
  - Returns `{ item }`.
- Progress: when an item with `fromShare` changes `status`:
  - friend share: `progress` → `seen: 'opened'` (only from `new`); `done` → `seen: 'done'`, `seenAt`;
  - group share: `done` → add `{user, at}` once.
- `PATCH /api/shares/:id/react { react }` (≤ 280 characters): only the recipient (friend share) or a member who has `done` (group).

- [ ] Tests: list, open, dismiss; save creates an item with the from-tag and note; saving twice → still one item (Review Focus 5); marking the saved item done sets the sender's share to done; the sender can't react; the recipient can; a group member's done is recorded once.

### Task 4: Groups and notifications

**Files:** `server/src/models/Group.ts`, `server/src/modules/groups/*`, `server/src/modules/notifications/*`; add `notificationsSeenAt` handling.

**Interfaces:**
- `GET /api/groups` → `{ groups: [{ id, name, desc, owner, members: users, links }] }` (mine).
- `POST /api/groups { name (1–40, "Name the group."), desc (≤ 90), members: friendIds (≥ 1, "Pick at least one member.") }` → 201.
- `GET /api/groups/:id` → `{ group, watchlist }`. Each watchlist entry is `{ shareId, from: user, url, title, type, mins, msg, at, done: [{user, at}], mine, saved }`, newest first. Members only.
- `PATCH /api/groups/:id` (owner): name, desc, members (from the owner's friends; the owner always stays).
- `DELETE /api/groups/:id` (owner): also deletes its shares and entries.
- `POST /api/groups/:id/leave`.
- `GET /api/notifications` → `{ items: [{ kind: 'request'|'inbox'|'opened'|'finished'|'reminder', at, text, link }], unseen: boolean }`, newest 10.
- `POST /api/notifications/seen` → 204.

- [ ] Tests: create (only with friends); a member sees the group but a non-member gets 404 (Review Focus 1); a non-owner can't rename or delete (404 for outsiders, 403 "Only the owner can change this group."); leave; the owner leaving deletes the group; notifications list a request and a new inbox entry, and `unseen` turns false after `seen`.

### Task 5: Client — friends, inbox, notifications

**Files:** `client/src/features/{friends,inbox,notifications}/{api,hooks,components,pages}/*`, routes `/friends/:id`, Rail counts, Topbar bell.

- Friends page:
  - Add friend modal ("Username or email"; error "Enter a username or an email address.").
  - Incoming requests with Accept/Decline.
  - Friend cards (avatar, @handle, watchlist progress bar, "Finished {done} of {n link(s)} on their watchlist" / "Nothing on their watchlist yet", "Sent you {n link(s)}", buttons Open watchlist / shelf / +).
  - "Requests you sent" with "Waiting for a reply".
  - Empty state: "No friends yet".
- Friend page:
  - Back link "All friends".
  - Reader card with the slip (Friends since, On their shelf, You sent, They sent) and the actions Add to watchlist / See {first}'s shelf / Remove friend (confirm "Remove this friend?").
  - Tabs: "Watchlist for {first}" (seen status, reaction, remove), "From {first}" (inbox rows), "{first}'s shelf" (type pills, sort, favourites; "Save to library" / "In your library").
- Inbox page (rows per prototype `inboxRow`): clicking the title link calls `open`. Save to library, Dismiss.
- Rail: Shared with me (new count, highlighted), Friends count, Groups count.
- Bell: list from `/api/notifications`, a dot when `unseen`, opening calls `seen`, and an "Open Shared with me" button.

- [ ] Tests: inbox save and dismiss call the API and toast; accepting a request moves it into friends; the add-friend error shows under the field; the bell dot disappears after opening.

### Task 6: Client — sharing, groups, reactions, friend activity

**Files:** `client/src/features/shares/*` (ShareModal, PickModal, ShareTargets, useSentShares), `client/src/features/groups/*` (pages, GroupForm), library card and item form changes, ReactModal, FriendActivityCard.

- ShareModal ("Share this link", "Friends and groups" checklist, ticked = shared now, "Ticked names have this link on their watchlist. Untick to take it off.", "Or send to a username" input, "Message, if you want one", button "Update sharing"). It sends a POST for newly ticked targets and a DELETE for unticked ones.
- PickModal ("Add to {label}", unshared library links only, "Add to watchlist").
- The item form gains "Put it on a watchlist" (ShareTargets).
- The card and row get share avatars (up to 3, "+n"), a bordered share button and a "Share" menu entry.
- Groups list and group page per the prototype:
  - members chips;
  - "Group watchlist {n}";
  - your rows show "{d} of {N} finished" and remove; others' rows show "Save to library" / "In your library";
  - owner menu: Edit name and members / Delete group;
  - members get "Leave group".
- GroupForm ("New group" / "Edit group", "Group name", "What is it for?", "Members").
- ReactModal: when a saved shared link becomes Finished, "What did you think?" with an optional textarea, and the buttons Send / Skip.
- FriendActivityCard lists the last 4 events from `/shares/sent` ("{first} opened/finished {title}", "in {group}").

- [ ] Tests: the share modal unticks one friend and ticks a group → one DELETE and one POST; pick modal with nothing ticked → "Pick at least one link"; creating a group navigates to it; finishing a shared link opens "What did you think?".

### Task 7: Docs and end-to-end check

- [ ] Spec §4.4–4.5 updated with R1–R3, README status "Stage 3 of 4".
- [ ] All server and client checks pass; two-user curl run: request → accept → share → inbox → save → done → sender sees "done".
