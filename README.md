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
  A MERN rebuild of the prototype <code>second-brain-bootstrap.html</code>.
</p>

<p align="center">
  <img alt="Build stage 2 of 4" src="https://shieldcn.dev/badge/stage-2_of_4-0E6A5B.svg?variant=secondary" />
</p>

| Layer                     | Tech                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| Runtime / package manager | Bun                                                                              |
| API                       | Express 5, Mongoose, Zod, bcrypt, JWT in an httpOnly cookie, morgan request logs |
| Database                  | MongoDB 8 in a Podman container                                                  |
| Client                    | React 19, Vite+ (`vp`), Tailwind CSS v4, React Router, TanStack Query            |
| Tests                     | Vitest (Supertest on the server; Testing Library + MSW on the client)            |

Design: [`docs/superpowers/specs/2026-10-24-second-brain-mern-design.md`](docs/superpowers/specs/2026-10-24-second-brain-mern-design.md)

## Status

Stages 1–2 of 4 are done:

- **Auth:** sign up, log in, log out, forgot and reset password, app shell.
- **Library:** save links from the capture bar or "Add link"; edit, delete, favourite, status and shelf; filter, search and sort in cards or rows; collections, custom types, tags, reminders, dust and pick for me.

Stages 3–4 (social, profile) are next.

## Setup

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

Password reset links are printed in the API's console. No email is sent.

## Test

```sh
cd server && bun run test        # uses the second-brain-test database
cd client && vp test && vp check # tests, then format + lint + typecheck
```

## Layout

```
server/src/
  app.ts               Express app (exported for tests)
  config/ db/ lib/     env, Mongo connection, HttpError
  middleware/          requireAuth, validate(zod), error handler
  models/              Mongoose models
  modules/<feature>/   routes → controller → service (+ schemas, tests)
client/src/
  app/                 App, router, providers
  features/<feature>/  api/ components/ hooks/ pages/ (+ index.ts public API)
  components/          layout (AppShell, Rail, Topbar) and ui primitives
  context/ lib/ styles/ test/
```
