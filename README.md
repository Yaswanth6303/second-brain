<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=Second+Brain&subtitle=Keep+every+link+worth+coming+back+to&theme=emerald&align=left&mode=dark&logoColor=54CCB3&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI%2BPHBhdGggZD0iTTIgNGEyIDIgMCAwIDEgMi0yaDZhMiAyIDAgMCAxIDIgMnYxMS41YS41LjUgMCAwIDEtLjc3Ny40MTZMNyAxMy4xMDFsLTQuMjIzIDIuODE1QS41LjUgMCAwIDEgMiAxNS41eiIvPjxwYXRoIGQ9Ik00LjI2OCAxQTIgMiAwIDAgMSA2IDBoNmEyIDIgMCAwIDEgMiAydjExLjVhLjUuNSAwIDAgMS0uNzc3LjQxNkwxMyAxMy43NjhWMmExIDEgMCAwIDAtMS0xeiIvPjwvc3ZnPg%3D%3D" />
    <img alt="Second Brain" src="https://shieldcn.dev/header/graph.svg?title=Second+Brain&subtitle=Keep+every+link+worth+coming+back+to&theme=emerald&align=left&mode=light&logoColor=0E6A5B&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI%2BPHBhdGggZD0iTTIgNGEyIDIgMCAwIDEgMi0yaDZhMiAyIDAgMCAxIDIgMnYxMS41YS41LjUgMCAwIDEtLjc3Ny40MTZMNyAxMy4xMDFsLTQuMjIzIDIuODE1QS41LjUgMCAwIDEgMiAxNS41eiIvPjxwYXRoIGQ9Ik00LjI2OCAxQTIgMiAwIDAgMSA2IDBoNmEyIDIgMCAwIDEgMiAydjExLjVhLjUuNSAwIDAgMS0uNzc3LjQxNkwxMyAxMy43NjhWMmExIDEgMCAwIDAtMS0xeiIvPjwvc3ZnPg%3D%3D" />
  </picture>
</p>

<p align="center">
  <a href="https://bun.sh"><img alt="Bun 1.4" src="https://shieldcn.dev/badge/Bun-1.4-000000.svg?logo=bun&variant=secondary" /></a>
  <a href="https://expressjs.com"><img alt="Express 5" src="https://shieldcn.dev/badge/Express-5-000000.svg?logo=express&variant=secondary" /></a>
  <a href="https://www.mongodb.com"><img alt="MongoDB 8" src="https://shieldcn.dev/badge/MongoDB-8-47A248.svg?logo=mongodb&variant=secondary" /></a>
  <a href="https://react.dev"><img alt="React 19" src="https://shieldcn.dev/badge/React-19-61DAFB.svg?logo=react&variant=secondary" /></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS v4" src="https://shieldcn.dev/badge/Tailwind_CSS-v4-06B6D4.svg?logo=tailwindcss&variant=secondary" /></a>
  <a href="https://vitest.dev"><img alt="Vitest 5" src="https://shieldcn.dev/badge/Vitest-5-6E9F18.svg?logo=vitest&variant=secondary" /></a>
</p>

<p align="center">
  Save links worth coming back to, tag them, share them with friends and groups, and see who finished them.<br />
  A full-stack MERN app on Bun, with a real multi-user backend.
</p>

<p align="center">
  <img alt="All 4 stages done" src="https://shieldcn.dev/badge/stage-4_of_4-0E6A5B.svg?variant=secondary" />
</p>

| Layer                     | Tech                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| Runtime / package manager | Bun                                                                              |
| API                       | Express 5, Mongoose, Zod, bcrypt, JWT in an httpOnly cookie, morgan request logs |
| Database                  | MongoDB 8 in a Podman container                                                  |
| Client                    | React 19, Vite+ (`vp`), Tailwind CSS v4, React Router, TanStack Query            |
| Tests                     | Vitest (Supertest on the server; Testing Library + MSW on the client)            |
| Security                  | bcrypt hashes, JWT session cookie, Zod at every endpoint, login/reset rate limits |

## Architecture

A React app talks to an Express 5 API on Bun through the Vite+ dev proxy; the API stores everything in MongoDB running in Podman. Each server feature is a module of routes → controller → service → Mongoose model.

- [Architecture](docs/architecture.md): system diagram and one request traced through the layers
- [Data model](docs/er-diagram.md): ER diagram of the six collections and how deletes cascade
- [API reference](docs/api.md): every endpoint

## Status

All four stages are done:

- **Auth:** sign up, log in, log out, forgot and reset password, app shell.
- **Library:** save links from the capture bar or "Add link"; edit, delete, favourite, status and shelf; filter, search and sort in cards or rows; collections, custom types, tags, reminders, dust and pick for me.
- **Social:** friends and requests; share links with friends, groups or a username; an inbox with opened/finished tracking and reactions; groups you can create, edit, leave or delete; a notifications bell and friend activity.
- **Profile:** reader card, shelf editor and bookshelf drawing, "See it as a friend", charts (time by type, when you save, give and take, tags), who you shared with, settings (profile, card colour, who can send you links, privacy, reminders), export as JSON, delete account, and profile links at `/u/:handle`.
- **Hardening:** rate limits on login and password reset, one share per link and person (enforced by the database), the current password to change your email, and screens checked against the prototype in light and dark mode.

## Setup

You need [Bun](https://bun.sh) 1.4+, the [Vite+](https://viteplus.dev) CLI (`vp`) and [Podman](https://podman.io).

1. Start MongoDB (Podman container `mongodb`, image `mongo:8`, port 27017):

   ```sh
   podman start mongodb
   # first time only:
   # podman run -d --name mongodb -p 27017:27017 \
   #   -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=<password> mongo:8
   ```

2. Configure the API: `cp server/.env.example server/.env` and fill in the password and a long random `JWT_SECRET`.

3. Install:

   ```sh
   cd server && bun install
   cd ../client && bun install
   ```

## Run

```sh
cd server && bun run dev   # API on http://localhost:4000
cd client && vp dev        # app on http://localhost:5173 (proxies /api to the API)
```

### Install as an app (PWA)

The built app is a Progressive Web App: a web app manifest, icons and a service worker (`client/public/sw.js`) that caches the app shell so it opens offline. API responses are never cached. The worker only runs in builds, so try it with `vp build && vp preview`, or from any HTTPS deployment.

- **Chrome, Edge, Brave, Opera** (desktop and Android): the install icon in the address bar, or the menu → Install.
- **Safari**: macOS Sonoma or later → File → Add to Dock; iPhone/iPad → Share → Add to Home Screen.
- **Firefox and Zen**: the app works and caches offline everywhere. Firefox for Android installs it from the menu; desktop Firefox has no install button.
- **Arc**: the app works and caches offline, but Arc has no install option.

Password reset links are printed in the API's console. No email is sent.

### Demo data

```sh
cd server && bun run seed
```

This creates the prototype's sample world: Aarav, his five friends, a pending friend request, 14 links, two groups, and shares with progress and reactions. Log in as **aarav@example.com** with password **demo-library-2026**. Running it again replaces only the demo accounts; other accounts are untouched.

## Test

```sh
cd server && bun run test        # 98 API tests in server/tests, against the second-brain-test database
cd client && vp test && vp check # 72 tests next to the code (*.test.tsx), then format + lint + typecheck
```

Server checks: `bun run lint`, `bun run format:check`, `bunx tsc --noEmit`.

## Layout

```
server/src/
  app.ts               Express app (exported for tests)
  config/ db/ lib/     env, Mongo connection, HttpError
  middleware/          requireAuth, validate (Zod), rate limits, error handler
  models/              Mongoose models
  modules/<feature>/   routes → controller → service (+ schemas)
  seed.ts              demo data (bun run seed)
server/tests/
  support/             setup (test database) and helpers (sign up, make friends)
  <feature>/           API tests per feature: auth, items, users, friends,
                       shares, inbox, groups, notifications
  middleware/          rate limits
  app.test.ts          health, 404, validation, bad JSON
  seed.test.ts         demo data is repeatable and safe
client/src/
  app/                 App, router, providers
  features/<feature>/  api/ components/ hooks/ pages/ (+ index.ts public API)
  components/          layout (AppShell, Rail, Topbar) and ui primitives
  context/ lib/ styles/
  test/                setup, MSW server, fixtures (tests sit next to the code)
docs/
  architecture.md · er-diagram.md · api.md
```
