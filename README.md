# Mario Logistics

A full-stack delivery management system built for last-mile logistics operations. Three role-specific applications share a single Node.js API with real-time updates, JWT authentication, and photo-based proof of delivery.

---

## Live demo

| App | URL | Purpose |
|---|---|---|
| Admin portal | https://mario-logistics.vercel.app | Fleet oversight, staff management, analytics |
| Dispatcher portal | https://mario-logistics-dispatcher.vercel.app | Create and assign deliveries, live monitoring |
| Driver app | https://mario-logistics-driver.vercel.app | Mobile-first delivery updates and proof capture |
| Backend API | https://mario-logistics.onrender.com | REST API + WebSocket server |

### Demo accounts

Password for every account is `hello123`

| Role | Name | Email | Portal |
|---|---|---|---|
| Admin | Mario Admin | `admin@mariologistics.fi` | Admin portal |
| Dispatcher | Sara Dispatcher | `sara@mariologistics.fi` | Dispatcher portal |
| Dispatcher | Anna Mäkinen | `anna@mariologistics.fi` | Dispatcher portal |
| Driver | Jari Korhonen | `jari@mariologistics.fi` | Driver app |
| Driver | Mikko Laine | `mikko@mariologistics.fi` | Driver app |

Two drivers and two dispatchers exist so the multi-user behaviour is visible — reassigning a delivery between drivers, and confirming that each driver only ever sees their own work.

Each portal accepts only its own role. Logging into the dispatcher portal with driver credentials is rejected, and the check happens on the server rather than being hidden in the UI.

> The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first request may take 30–60 seconds while it wakes. Everything after that is immediate.

---

## Trying it out

Each role sees a different slice of the same system. The sections below walk through all three.

Because a browser stores one session at a time, viewing two roles at once requires a normal window plus an incognito window.

### 1. The dispatcher — creating and assigning work

Log into the **dispatcher portal** as Sara.

- **New Delivery** opens a form for recipient, address, priority, package count, and driver notes. A tracking code (`ML-0001`, `ML-0002`…) is generated server-side on save.
- The status tabs across the top filter the board — All, Pending, In Transit, Delivered, Failed — with live counts.
- **Assign** on a pending row opens a driver picker listing every active driver.
- **Cancel** removes a delivery, but only while it is still pending.
- The green *Live* badge indicates an open WebSocket connection.

### 2. The driver — working through a delivery

Open an incognito window and log into the **driver app** as Jari.

- Only Jari's own deliveries appear. Nothing belonging to Mikko is visible, and this is enforced by the query rather than by hiding rows.
- The three counters at the top show outstanding, completed, and failed work for the day.
- **Picked Up** moves a delivery to in transit and stamps `picked_up_at`.
- The camera button uploads a proof photo, which appears on the card once stored.
- **Delivered** closes it out and stamps `delivered_at`.
- **Failed** prompts for a reason, which is written to the audit log.
- The **History** tab lists past completed and failed deliveries.

### 3. Watching real-time updates

Put both windows side by side — dispatcher in one, driver in the other.

1. On the dispatcher side, create a delivery and assign it to Jari
2. It appears on Jari's screen without a refresh
3. On the driver side, tap **Picked Up**
4. The dispatcher's row flips to *In Transit* on its own, and a toast slides in
5. Upload a photo, then tap **Delivered**
6. The dispatcher sees the final status change live

No polling, no refresh button. Events flow in both directions over a WebSocket.

### 4. Reassignment — using the second driver

1. As the dispatcher, create a delivery and assign it to **Jari**
2. Confirm it appears in Jari's list
3. Back on the dispatcher board, click **Reassign** and pick **Mikko**
4. The delivery disappears from Jari's screen
5. Log in as **Mikko** in a third window — it is now in his list

Reassignment is state-aware. A delivery can move between drivers while pending, or after a failed attempt, but not once it has been picked up — the backend rejects that with a clear message.

### 5. The admin — oversight and staff management

Log into the **admin portal** as Mario Admin.

- **Dashboard** — total deliveries, active drivers, success rate, and average delivery time, alongside driver performance and recent activity.
- **Analytics** — deliveries per day, a status breakdown doughnut, and busiest hours by volume.
- **Drivers** — create, edit, deactivate, and remove driver accounts. Deactivating removes a driver from the dispatcher's assign list while preserving their delivery history.
- **Dispatchers** — create and remove dispatcher accounts.

Anything actioned in the other two portals is reflected here on the next load.

---

## The problem

Small courier companies coordinate deliveries over WhatsApp and spreadsheets. There is no single view of what has been picked up, who is carrying it, or whether it arrived. Enterprise logistics software solves this at a price point that excludes small operators.

Mario Logistics is a lightweight alternative — three purpose-built interfaces over one API, covering the full delivery lifecycle from creation to signed-off proof.

---

## How it works

```
Dispatcher creates delivery  →  assigns a driver
                                      ↓
                        Driver's phone updates instantly
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
- Socket.io — bidirectional real-time updates
- Multer — multipart file handling

**Frontend**
- React 18 + Vite — three separate single-page apps
- React Router — client-side routing with role guards
- Axios — HTTP client with automatic token injection
- Chart.js — analytics visualisations
- Socket.io client — live event subscription

**Infrastructure**
- Render — backend hosting (long-lived process required for WebSockets)
- Vercel — three static frontend deployments
- Supabase — managed Postgres and object storage

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

Routes carry no logic — they map URLs to controllers and declare which middleware guards them. Controllers hold the database work. Adding an endpoint is a two-line route change plus one controller function.

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

Both the dispatcher dashboard and the driver app hold open WebSocket connections. Three controllers emit events — `assignDriver`, `updateStatus`, and `uploadProof`:

```javascript
req.app.get("io").emit("delivery:updated", updated)
```

The dispatcher patches the affected table row in place, since it already holds every delivery. The driver refetches instead — an assignment means a delivery that was not previously in their list now belongs to them, so there is nothing to patch.

The `io` instance is stored on the Express app at startup and retrieved through `req.app.get("io")`. This avoids a module-loading race where controllers would otherwise capture an uninitialised reference.

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

## Deployment

**Backend — Render**

Deployed as a web service from this repo with root directory `mario-logistics-backend`. Build runs `npm install`, start runs `npm start`.

Render was chosen over serverless platforms because Socket.io requires a long-lived process. A serverless function that spins up per request has nowhere to hold an open WebSocket connection.

`PORT` is injected by Render rather than set manually — `server.js` reads `process.env.PORT` with a fallback to 5000 for local development.

**Frontends — Vercel**

Three separate Vercel projects pointing at the same repository, each with a different root directory. Each sets `VITE_API_URL` to the Render backend URL.

Each frontend includes a `vercel.json` rewriting all paths to `index.html`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Without this, React Router works when navigating inside the app but a directly-entered URL like `/login` returns 404 — the static host looks for a file at that path and finds none.

**CORS**

The Socket.io origin list in `config/socket.js` names both the localhost development ports and the three production Vercel domains, so the same codebase runs in either environment.

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

**Reassignment is state-aware.** A delivery can be handed to a different driver while pending, or after a failed attempt, but not once it has been picked up.

**Drivers query their own data.** `getMyDeliveries` filters on `req.user.id` taken from the token, so one driver cannot request another's deliveries by manipulating a parameter.

---

## Known limitations

- Dispatcher editing is not implemented — only creation and removal. The pattern matches the driver equivalent and was deprioritised for v1.
- Replacing a proof photo orphans the previous file in Storage rather than deleting it.
- Analytics covers all time rather than a rolling window.
- Single-tenant in practice — the `companies` table supports multiple, but the backend reads one company ID from configuration.
- The free Render tier sleeps when idle, producing a cold start on the first request after a quiet period.

---

## Author

Built as a self-directed project to learn backend development. The frontend was familiar territory; Node.js, Express, PostgreSQL, JWT, WebSockets, and file handling were not.
