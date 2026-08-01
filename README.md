# Mario Logistics

A full-stack delivery management system built for last-mile logistics operations. Three role-specific applications share a single Node.js API with real-time updates, JWT authentication, and photo-based proof of delivery.

**Live demo** — _add URLs after deployment_

| App | URL | Role |
|---|---|---|
| Admin portal | `—` | Fleet oversight, staff management, analytics |
| Dispatcher portal | `—` | Create and assign deliveries, live monitoring |
| Driver app | `—` | Mobile-first delivery updates and proof capture |

---

## The problem

Small courier companies coordinate deliveries over WhatsApp and spreadsheets. There is no single view of what has been picked up, who is carrying it, or whether it arrived. Enterprise logistics software solves this at a price point that excludes small operators.

Mario Logistics is a lightweight alternative — three purpose-built interfaces over one API, covering the full delivery lifecycle from creation to signed-off proof.

---

## How it works

```
Dispatcher creates delivery  →  assigns a driver
                                      ↓
                          Driver sees it on their phone
                                      ↓
                    Picked up  →  In transit  →  Delivered
                                      ↓
                        Photo uploaded as proof
                                      ↓
              Dispatcher's screen updates live via WebSocket
```

Every status change is written to an audit log recording who changed what and when.

---

## Tech stack

**Backend**
- Node.js + Express — REST API
- Supabase (PostgreSQL) — database and file storage
- JSON Web Tokens — stateless authentication
- bcrypt — password hashing
- Socket.io — real-time dispatcher updates
- Multer — multipart file handling

**Frontend**
- React 18 + Vite — three separate single-page apps
- React Router — client-side routing with role guards
- Axios — HTTP client with automatic token injection
- Chart.js — analytics visualisations
- Socket.io client — live event subscription

---

## Architecture

```
mario-logistics/
├── mario-logistics-backend/
│   ├── server.js                  entry point, HTTP + WebSocket server
│   └── src/
│       ├── app.js                 Express setup, middleware, route mounting
│       ├── config/
│       │   ├── supabase.js        database client
│       │   └── socket.js          Socket.io initialisation
│       ├── middleware/
│       │   ├── auth.js            JWT verification
│       │   ├── requireRole.js     role-based authorisation
│       │   └── upload.js          Multer file handling
│       ├── routes/                URL definitions
│       └── controllers/           business logic
├── admin/                         React — admin portal
├── dispatcher/                    React — dispatcher portal
└── driver/                        React — driver mobile app
```

Routes carry no logic — they map URLs to controllers and declare which middleware guards them. Controllers hold the database work. This separation means adding an endpoint is a two-line route change plus one controller function.

---

## Authentication

Login returns a signed JWT containing the user's id, name, and role. The token expires after seven days.

Every protected request passes through two middleware layers:

```javascript
router.get("/stats", auth, requireRole("admin"), getStats)
```

`auth` verifies the token signature and attaches the decoded user to `req.user`. `requireRole` checks that user's role against the allowed list. A driver hitting an admin route receives 403 before the controller ever runs.

The secret never leaves the server. The token travels with each request and carries everything the backend needs to identify the caller — no session store, no database lookup per request.

---

## Database schema

Four tables, related through foreign keys.

**companies** — the operating business
**users** — admins, dispatchers, and drivers in one table, separated by a `role` column with a CHECK constraint
**deliveries** — the core record, linked to a company, its creator, and an assigned driver
**delivery_logs** — an append-only audit trail of every status transition

The foreign key on `deliveries.driver_id` lets a single query pull a delivery and its driver's name together:

```javascript
.select("*, driver:driver_id (name)")
```

Supabase reads the relationship from the schema itself, replacing what would otherwise be an N+1 query pattern.

---

## Real-time updates

The dispatcher dashboard holds an open WebSocket connection. When a driver changes a delivery status, the controller writes to the database, logs the change, then emits:

```javascript
req.app.get("io").emit("delivery:updated", updated)
```

Connected dispatcher clients receive the event and update the affected table row in place. No polling, no refresh.

The `io` instance is stored on the Express app at startup and retrieved through `req.app.get("io")` — this avoids a module-loading race where controllers would otherwise capture an uninitialised reference.

---

## Proof of delivery

Drivers photograph completed deliveries. The file travels as `multipart/form-data`, is parsed by Multer into memory, and forwarded to Supabase Storage:

```
Driver selects photo
  → Multer parses to req.file.buffer
  → uploaded to Supabase Storage bucket
  → public URL saved to deliveries.proof_photo_url
  → Socket.io event pushes the update to dispatchers
```

Memory storage is deliberate — the file only passes through on its way to Storage, and deployment platforms use ephemeral filesystems where anything written to disk is lost on restart.

Filenames combine the delivery UUID with a timestamp, making collisions impossible.

---

## Running locally

**Prerequisites** — Node.js 18+, a Supabase project

**Backend**

```bash
cd mario-logistics-backend
npm install
npm run dev
```

Create `.env`:

```
PORT=5000
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
JWT_SECRET=any_long_random_string
COMPANY_ID=uuid_from_companies_table
```

**Frontends** — each in its own terminal

```bash
cd admin && npm install && npm run dev        # :3001
cd dispatcher && npm install && npm run dev   # :3002
cd driver && npm install && npm run dev       # :3003
```

Each needs a `.env` containing:

```
VITE_API_URL=http://localhost:5000/api
```

---

## API reference

**Authentication**

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Any authenticated user |

**Deliveries**

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/deliveries` | Admin, Dispatcher |
| POST | `/api/deliveries` | Admin, Dispatcher |
| PATCH | `/api/deliveries/:id/assign` | Admin, Dispatcher |
| PATCH | `/api/deliveries/:id/status` | Driver |
| POST | `/api/deliveries/:id/proof` | Driver |
| DELETE | `/api/deliveries/:id` | Admin, Dispatcher |

**Administration**

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/admin/drivers` | Admin, Dispatcher |
| POST | `/api/admin/drivers` | Admin |
| PATCH | `/api/admin/drivers/:id` | Admin |
| DELETE | `/api/admin/drivers/:id` | Admin |
| GET | `/api/admin/dispatchers` | Admin |
| POST | `/api/admin/dispatchers` | Admin |
| DELETE | `/api/admin/dispatchers/:id` | Admin |

**Driver**

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/driver/deliveries` | Driver |
| GET | `/api/driver/history` | Driver |

---

## Design decisions

**No public registration.** Accounts are created by an admin through the dashboard. A public signup form on a logistics system would let anyone provision themselves access.

**Roles are hardcoded per endpoint.** `createDriver` always writes `role: "driver"` rather than reading it from the request body — otherwise a crafted request could mint an admin account.

**Soft deletes.** Removing a driver sets `is_active: false` rather than deleting the row, preserving the delivery history attached to them.

**Whitelisted update fields.** Update controllers build an explicit object from named fields instead of passing `req.body` straight to the database, so a request cannot alter `role` or `company_id`.

---

## Known limitations

- Dispatcher editing is not implemented — only creation and removal. The pattern matches the driver equivalent and was deprioritised for v1.
- Replacing a proof photo orphans the previous file in Storage rather than deleting it.
- Analytics covers all time rather than a rolling window.
- Single-tenant in practice — the `companies` table supports multiple, but the backend reads one company ID from configuration.

---

## Author

Built as a self-directed project to learn backend development. The frontend was familiar territory; Node.js, Express, PostgreSQL, JWT, WebSockets, and file handling were not.
