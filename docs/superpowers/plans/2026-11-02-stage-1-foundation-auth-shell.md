# Stage 1 — Foundation, Auth, App Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Bun + Express + MongoDB server with real signup/login/logout/me/forgot/reset, and a React + Tailwind client showing the prototype's auth screen and the empty app shell (left rail, top bar, theme toggle, account menu).

**Architecture:** Server is `app.ts` (exported, testable) + feature modules layered routes → controller → service → model, with Zod validation and one error handler. Client is feature-based (`features/auth`), with TanStack Query and React Router, and Tailwind v4 `@theme` tokens copied from the prototype `:root`.

**Tech Stack:** Bun 1.4.4, Express 5, Mongoose, Zod, bcrypt, jsonwebtoken, cookie-parser; React 19, Vite+ (`vp`), Tailwind v4, React Router, TanStack Query, bootstrap-icons; Vitest (+ Supertest server, Testing Library + MSW client).

**Spec:** `docs/superpowers/specs/2026-10-24-second-brain-mern-design.md`

## Global Constraints

- Bun only (`bun add`, `bun run`, `bunx`), never npm.
- MongoDB = Podman container `mongodb` (mongo:8, `localhost:27017`, `root`, `authSource=admin`). `server/.env` holds `PORT=4000`, `MONGO_URI` (db `second-brain`), `MONGO_URI_TEST` (db `second-brain-test`), `JWT_SECRET`, `CLIENT_ORIGIN=http://localhost:5173`.
- Error body is always `{ error: { message: string, fields?: Record<string,string> } }`.
- Auth cookie `sb_token`: httpOnly, SameSite=Lax, `secure` only in production, 7-day JWT `{ sub: userId }`.
- bcrypt cost 10. Reset token: 32 random bytes hex; store SHA-256 hash + expiry 1 h; log `Reset link: ${CLIENT_ORIGIN}/reset/${token}`.
- Validation copy (from prototype): handle `/^[a-z0-9_.]{3,20}$/` "Use 3 to 20 lowercase letters, numbers, dots or underscores."; password min 8 "Use at least 8 characters."; name required "Tell us what to call you."; email "Enter a valid email address.".
- User JSON never includes `passwordHash`, `resetTokenHash`, `resetExpires`.
- Client code: no TS enums / parameter properties (`erasableSyntaxOnly`). Import test APIs from `vite-plus/test` (lint rule `prefer-vite-plus-imports`).
- Server tests share one database → Vitest `fileParallelism: false`.

## Review Focus

1. Duplicate email/handle on signup (case differences) → 409 with `fields.email` / `fields.handle`, not 500. Test in Task 2.
2. Login with wrong password vs unknown email → identical 401 "Email or password is wrong." (no user enumeration). Test in Task 2.
3. Forgot with unknown email → same 200 response as known email. Test in Task 3.
4. Expired or reused reset token → 400 "This reset link has expired. Ask for a new one." Test in Task 3.
5. Reload while logged in → `/api/auth/me` restores session; tampered/expired cookie → 401 and the client shows login, not a blank screen. Tests in Task 2 and Task 5.

---

### Task 1: Server foundation

**Files:**
- Modify: `server/package.json` (scripts `dev`, `start`, `test: "bunx --bun vitest run"`)
- Create: `server/vitest.config.ts`, `server/src/config/env.ts`, `server/src/db/connect.ts`, `server/src/lib/http-error.ts`, `server/src/middleware/error.ts`, `server/src/middleware/validate.ts`, `server/src/app.ts`, `server/.env.example`
- Modify: `server/src/index.ts`
- Test: `server/src/test/setup.ts`, `server/src/app.test.ts`

**Interfaces:**
- Produces: `env` `{ PORT, MONGO_URI, MONGO_URI_TEST, JWT_SECRET, CLIENT_ORIGIN, isProd }`; `connectDb(uri: string): Promise<void>`; `class HttpError(status: number, message: string, fields?: Record<string,string>)`; `validate({ body?, query?, params? }: ZodSchemas)` middleware that replaces `req.body` with parsed data; `createApp(): Express`. Route mount point `app.use('/api/<module>', router)`.

- [ ] Install: `bun add mongoose zod bcrypt jsonwebtoken cookie-parser cors` and `bun add -d vitest supertest @types/supertest @types/bcrypt @types/jsonwebtoken @types/cookie-parser @types/cors typescript`.
- [ ] Write `app.test.ts`: `GET /api/health` → 200 `{ ok: true }`; `GET /api/nope` → 404 `{ error: { message: 'Not found' } }`; a test-only route with `validate({ body: z.object({ n: z.number() }) })` posted `{ n: 'x' }` → 400 with `error.fields.n`.
- [ ] Run `bun run test` → FAIL (no app).
- [ ] Implement; setup file connects with `MONGO_URI_TEST` in `beforeAll`, clears every collection in `beforeEach`, disconnects in `afterAll`. Error handler also maps Mongoose duplicate key (11000) → 409 with `fields[key] = 'Already taken.'`.
- [ ] Run `bun run test` → PASS.

### Task 2: User model, signup/login/logout/me, requireAuth

**Files:**
- Create: `server/src/models/User.ts`, `server/src/middleware/auth.ts`, `server/src/modules/auth/{auth.routes,auth.controller,auth.service,auth.schemas}.ts`
- Test: `server/src/modules/auth/auth.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `User` model per spec §4.4 (prefs defaults `{ who:'friends', status:true, pub:false, digest:true, dust:true }`, `hue` random 0–359, `shelf:[]`, `collections:[]`, `customTypes:[]`), `toPublicUser(doc) → { id, name, handle, email, bio, hue, prefs, createdAt }`; `requireAuth` sets `req.userId: string` (declared via `express` module augmentation); `setAuthCookie(res, userId)`, `clearAuthCookie(res)`.
- Endpoints: `POST /api/auth/signup {name, handle, email, password}` → 201 `{ user }` + cookie; `POST /api/auth/login {email, password}` → 200 `{ user }` + cookie; `POST /api/auth/logout` → 204; `GET /api/auth/me` → 200 `{ user }` | 401 "Log in to continue.".

- [ ] Write tests: signup sets `sb_token` cookie and returns user without `passwordHash`; signup with `Email@X.com` after `email@x.com` → 409 `fields.email`; same for handle; invalid handle `"A!"` → 400 `fields.handle`; login ok; wrong password and unknown email both → 401 "Email or password is wrong."; `me` with cookie → user; `me` with garbage cookie → 401; logout clears cookie.
- [ ] Run → FAIL.
- [ ] Implement (email/handle stored lowercase; bcrypt `hash(pw, 10)`).
- [ ] Run → PASS.

### Task 3: Forgot / reset password

**Files:**
- Modify: auth routes/controller/service/schemas
- Test: `server/src/modules/auth/reset.test.ts`

**Interfaces:**
- Endpoints: `POST /api/auth/forgot {email}` → 200 `{ ok: true }` always; `POST /api/auth/reset {token, password}` → 200 `{ user }` + cookie (logs the user in), clears token fields.
- Produces: `authService.requestReset(email): Promise<string | null>` (returns raw token for tests; controller ignores it).

- [ ] Write tests: forgot for unknown email → 200; token from `requestReset` resets password and old password no longer logs in; reusing the token → 400 "This reset link has expired. Ask for a new one."; expired token (set `resetExpires` in the past) → same 400.
- [ ] Run → FAIL. Implement. Run → PASS.

### Task 4: Client foundation

**Files:**
- Modify: `client/package.json`, `client/vite.config.ts` (tailwind plugin, `server.proxy['/api'] → http://localhost:4000`, `test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'] }`), `client/index.html` (title "Second Brain", Google Fonts link copied from prototype line 8), `client/src/main.tsx`
- Delete: `client/src/App.tsx`, `App.css`, `index.css`, `assets/hero.png`, `assets/react.svg`, `assets/vite.svg`
- Create: `client/src/styles/index.css`, `client/src/lib/api-client.ts`, `client/src/test/setup.ts`, `client/src/test/server.ts`
- Test: `client/src/lib/api-client.test.ts`

**Interfaces:**
- Produces: `api<T>(path: string, opts?: { method?: string; body?: unknown }): Promise<T>` — prefixes `/api`, `credentials: 'include'`, JSON body, returns `undefined` on 204, throws `ApiError { status: number; message: string; fields?: Record<string,string> }` from the error body. Tailwind tokens: every prototype `:root` variable becomes a `--color-*` / `--font-*` theme token (`bg`, `surface`, `surface-2`, `ink`, `muted`, `line`, `brand`, `brand-strong`, `brand-ink`, `brand-soft`, `mark`, `mark-ink`, `panel`, `panel-ink`, `panel-card`, `t-article`… `t-custom`, `ok`, `warn`, `danger`; fonts `display`, `body`, `mono`), with the dark values under `@media (prefers-color-scheme: dark) :root:not([data-theme=light])` and `:root[data-theme=dark]` exactly as in the prototype.

- [ ] Install: `bun add react-router @tanstack/react-query bootstrap-icons zod` and `bun add -d tailwindcss @tailwindcss/vite @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw`.
- [ ] Write `api-client.test.ts` (MSW): 200 JSON returned; 204 → `undefined`; 409 body → throws `ApiError` with `status 409` and `fields.email`.
- [ ] Run `vp test` → FAIL. Implement. Run → PASS.

### Task 5: Auth feature (context, pages, routing guard)

**Files:**
- Create: `client/src/app/{App,router,providers}.tsx`, `client/src/context/ThemeContext.tsx`, `client/src/features/auth/{index.ts,AuthContext.tsx,schemas.ts,api/auth.ts,lib/strength.ts,components/AuthLayout.tsx,components/PasswordInput.tsx,pages/LoginPage.tsx,pages/SignupPage.tsx,pages/ForgotPage.tsx,pages/ResetPage.tsx}`
- Test: `features/auth/lib/strength.test.ts`, `features/auth/pages/SignupPage.test.tsx`, `features/auth/AuthGate.test.tsx`

**Interfaces:**
- Consumes: `api` (Task 4), endpoints (Tasks 2–3).
- Produces: `useAuth(): { user: User | null; loading: boolean; login(email, pw); signup(input); logout(); setUser(u) }`; `<RequireAuth>` route wrapper (loading → nothing, no user → `<Navigate to="/login">`); `useTheme(): { theme: 'light'|'dark'; toggle() }` storing choice in `localStorage['sb-theme']` (try/catch) and setting `document.documentElement.dataset.theme`. Routes: `/login`, `/signup`, `/forgot`, `/reset/:token`, and protected `/` → `/library`.
- `passwordStrength(p: string): { score: 0|1|2|3|4; hint: string }` — the prototype's rule: +1 length ≥ 8, +1 upper and lower, +1 digit, +1 symbol or length ≥ 14; hint `['Too short','Weak. Add a number and a capital letter.','Fair. A symbol would help.','Good','Strong'][len<8 ? 0 : score]`, empty → "Use 8 or more characters with a number and a capital letter.".

- [ ] Tests: strength table (`''`, `'abc'`, `'abcdefgh'`→1 'Weak…', `'Abcdefgh1'`→3 'Good', `'Abcdefgh1!'`→4 'Strong'); Signup shows field errors from a 409 (`fields.handle` → "Already taken." under Username) and requires the terms box ("You need to agree before you can sign up."); AuthGate: `/api/auth/me` 401 → login page rendered.
- [ ] Run → FAIL. Implement the markup to match the prototype auth screen (panel side with headline + three stacked cards at ≥ lg, segmented Log in / Sign up, forms and copy verbatim from prototype lines 368–464). "Open the demo library" button is dropped (no demo mode in the real app). Forgot shows the prototype's done-box text with "This demo sends no email." replaced by "Check the server console for the link.".
- [ ] Run → PASS.

### Task 6: App shell + UI primitives

**Files:**
- Create: `client/src/components/layout/{AppShell,Rail,Topbar,RightRail}.tsx`, `client/src/components/ui/{Button,Avatar,Dropdown,Toast,EmptyState}.tsx`, `client/src/features/library/{index.ts,pages/LibraryPage.tsx}` (placeholder), placeholder pages `features/{inbox,friends,groups,profile}/pages/*Page.tsx`
- Test: `components/layout/AppShell.test.tsx`

**Interfaces:**
- Produces: `<Avatar name hue size />` (initials, `hsl(hue 48% 38%)`); `<Dropdown trigger align="end">` (click outside / Esc closes, `aria-expanded`); `useToast(): (msg: string) => void` with `<ToastProvider>`; `<EmptyState icon title text action? />`; `<Button variant="primary"|"outline"|"ghost" size>`. Rail links: Library `/library` bi-collection, Shared with me `/inbox` bi-inbox, Friends `/friends` bi-people, Groups `/groups` bi-diagram-3, Profile `/profile` bi-person-circle (counts come in later stages); rail foot drops the "Sample data" block. Topbar: search (with `/` shortcut focusing it), Add link button (disabled until stage 2), bell (dropdown "Notifications" empty state), theme toggle (bi-moon-stars / bi-sun), account menu (name · @handle, Profile, Settings, Log out). Below lg the rail is an off-canvas drawer opened by bi-list.
- Placeholder pages render the prototype `page-head` title with `<EmptyState>` "Coming in stage N".

- [ ] Test: logged-in shell renders rail links with `aria-current="page"` on Library; Log out calls `POST /api/auth/logout` and lands on `/login`; theme toggle flips `data-theme`.
- [ ] Run → FAIL. Implement. Run → PASS.

### Task 7: Wire-up and end-to-end check

**Files:**
- Create: root `README.md` (stage 1 setup: start Podman `mongodb`, `cp server/.env.example server/.env`, `bun install` in both, `bun run dev` in server, `vp dev` in client), `package.json` scripts only if needed.

- [ ] `bun run test` (server) and `vp test` + `vp check` (client) → all PASS.
- [ ] Start both; in a browser: sign up → land on `/library` shell; reload → still logged in; log out → `/login`; forgot → reset link in server log → open it, set new password → logged in; dark mode toggle matches prototype colours.
