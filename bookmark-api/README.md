# Bookmark Manager API

A CRUD REST API with JWT authentication, built with Node.js, Express, and PostgreSQL. Lets users organize saved links into collections.

Resources: **users** (auth), **collections** (full CRUD), **bookmarks** (full CRUD, each belongs to a collection).

## Tech stack

Node.js + Express, PostgreSQL (`pg`), bcryptjs, jsonwebtoken, cors.

## Local setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your local Postgres connection string, then:

```bash
npm start
```

Tables are created automatically on first run.

## Deploying to Render

Push to GitHub, then in Render choose **New → Blueprint** and point it at this repo — `render.yaml` sets up both the web service and a free Postgres database automatically. Once deployed, set `FRONTEND_URL` in the service's Environment tab to your deployed frontend's URL.

---

## Endpoints

### `GET /health`
Returns `{ "status": "ok" }`.

### `POST /api/auth/register` / `POST /api/auth/login`
Body: `{ "email": "...", "password": "..." }`. Returns `{ "user": {...}, "token": "<jwt>" }`.

### Collections (🔒 all require `Authorization: Bearer <token>`)
- `GET /api/collections` — list, each with a `bookmark_count`
- `GET /api/collections/:id`
- `POST /api/collections` — body: `{ "name": "..." }`
- `PUT /api/collections/:id` — body: `{ "name": "..." }`
- `DELETE /api/collections/:id` — also deletes its bookmarks (cascade)

### Bookmarks (🔒)
- `GET /api/bookmarks?collection_id=3` — list, optionally filtered
- `GET /api/bookmarks/:id`
- `POST /api/bookmarks` — body: `{ "title": "...", "url": "https://...", "note": "...", "collection_id": 3 }`
- `PUT /api/bookmarks/:id` — any subset of `title`, `url`, `note`
- `DELETE /api/bookmarks/:id`

## Status codes

200 (success), 201 (created), 400 (validation), 401 (auth), 404 (not found / not yours).

## Notes

- A bookmark's `collection_id` is verified to belong to the requesting user before creation.
- Tested end-to-end against a real PostgreSQL database: auth, full collection CRUD, full bookmark CRUD, URL validation, and ownership checks.
