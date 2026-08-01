# Mario Logistics — Frontend Project

Three React apps that power the Mario Logistics delivery management system.

---

## Project Structure

```
mario-logistics/
├── admin/          → Admin portal  (port 3001)
├── dispatcher/     → Dispatcher portal  (port 3002)
├── driver/         → Driver mobile app  (port 3003)
└── README.md
```

---

## How to Run

Each app is independent. Open three terminal windows:

```bash
# Terminal 1 — Admin
cd admin
npm install
npm run dev
# → http://localhost:3001

# Terminal 2 — Dispatcher
cd dispatcher
npm install
npm run dev
# → http://localhost:3002

# Terminal 3 — Driver
cd driver
npm install
npm run dev
# → http://localhost:3003
```

---

## Connecting to Your Backend

Every app has a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Change `localhost:5000` to your deployed backend URL when you go live.

The axios instance in `src/lib/axios.js` reads this variable automatically.
You do not need to touch any other file to switch environments.

---

## How JWT Works (Plain English)

JWT = JSON Web Token. It is how your backend knows who is making a request.

**Step 1 — Login**
The user submits their email and password.
Your backend checks the database, and if correct, creates a JWT token:

```javascript
// On your backend (you will write this)
const token = jwt.sign(
  { id: user.id, role: user.role, name: user.name },  // payload — stored inside token
  process.env.JWT_SECRET,   // secret key — only your server knows this
  { expiresIn: '7d' }       // token expires in 7 days
)
res.json({ token, user })   // send to frontend
```

**Step 2 — Frontend saves the token**
The frontend (AuthContext.jsx) saves the token in localStorage:

```javascript
localStorage.setItem('ml_token', token)
```

**Step 3 — Every request includes the token**
The axios.js interceptor automatically adds it to every API call:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 4 — Backend verifies the token**
Your auth middleware reads the header and verifies it:

```javascript
// middleware/auth.js (you will build this)
const token = req.headers.authorization?.split(' ')[1]
const decoded = jwt.verify(token, process.env.JWT_SECRET)
req.user = decoded  // now every route knows who is calling it
```

**Why is this secure?**
The token is cryptographically signed. If anyone tampers with it
(e.g. changes their role from 'driver' to 'admin'), the signature
becomes invalid and your backend rejects it.

---

## How Multer Works (Plain English)

Multer = middleware that handles file uploads on your Node.js backend.

**Normal JSON request:**
```
Content-Type: application/json
Body: { "status": "delivered" }
```

**File upload request:**
```
Content-Type: multipart/form-data
Body: [binary file data + field names]
```

The browser cannot send a file as JSON. It uses a special format
called `multipart/form-data`. Multer reads this format on the backend.

**Frontend (MyDeliveries.jsx) — how we send the file:**
```javascript
const formData = new FormData()
formData.append('photo', file)        // 'photo' must match backend field name

await axios.post(`/deliveries/${id}/proof`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

**Backend (you will build this) — how Multer receives it:**
```javascript
const multer = require('multer')

// Option A: Save to disk
const upload = multer({ dest: 'uploads/' })

// Option B: Save to Supabase Storage (recommended)
const upload = multer({ storage: multer.memoryStorage() })

// Route
router.post('/deliveries/:id/proof',
  auth,
  requireRole('driver'),
  upload.single('photo'),    // 'photo' matches formData.append('photo', ...)
  async (req, res) => {
    const file = req.file   // Multer puts the file here
    // Upload file.buffer to Supabase Storage
    // Save the returned URL to database
    res.json({ url: photoUrl })
  }
)
```

---

## Backend Routes Your Frontend Expects

Build these routes in your Node.js backend:

| Method | Path | Used by |
|--------|------|---------|
| POST | /api/auth/login | All apps |
| GET | /api/auth/me | All apps |
| GET | /api/admin/stats | Admin |
| GET | /api/admin/drivers | Admin + Dispatcher |
| POST | /api/admin/drivers | Admin |
| PUT | /api/admin/drivers/:id | Admin |
| DELETE | /api/admin/drivers/:id | Admin |
| GET | /api/admin/dispatchers | Admin |
| POST | /api/admin/dispatchers | Admin |
| DELETE | /api/admin/dispatchers/:id | Admin |
| GET | /api/admin/analytics | Admin |
| GET | /api/deliveries | Dispatcher |
| POST | /api/deliveries | Dispatcher |
| PATCH | /api/deliveries/:id/assign | Dispatcher |
| DELETE | /api/deliveries/:id | Dispatcher |
| PATCH | /api/deliveries/:id/status | Driver |
| POST | /api/deliveries/:id/proof | Driver (Multer) |
| GET | /api/driver/deliveries | Driver |
| GET | /api/driver/history | Driver |

---

## What the Backend Must Return

**POST /api/auth/login**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "Jari Korhonen",
    "email": "jari@mario.fi",
    "role": "driver"
  }
}
```

**GET /api/deliveries**
```json
{
  "deliveries": [
    {
      "id": "uuid",
      "tracking_code": "ML-0241",
      "recipient_name": "Timo Virtanen",
      "recipient_phone": "+358401234567",
      "address": "Kauppakatu 12, Kuopio",
      "status": "pending",
      "priority": "high",
      "notes": "Leave at door",
      "driver_id": null,
      "driver_name": null,
      "proof_photo_url": null,
      "package_count": 2,
      "created_at": "2026-07-11T08:00:00Z"
    }
  ]
}
```

**GET /api/admin/stats**
```json
{
  "totalDeliveries": 1284,
  "activeDrivers": 14,
  "onRouteNow": 3,
  "successRate": 94,
  "avgDeliveryMins": 38
}
```

**GET /api/admin/analytics**
```json
{
  "monthTotal": 342,
  "onTimeRate": 91,
  "avgPerDay": 11,
  "dailyDeliveries": [
    { "date": "Jul 1", "count": 12 },
    { "date": "Jul 2", "count": 8 }
  ],
  "statusBreakdown": {
    "delivered": 290,
    "in_transit": 24,
    "pending": 18,
    "failed": 10
  },
  "busyHours": [
    { "hour": 9, "count": 45 },
    { "hour": 14, "count": 62 }
  ]
}
```

---

## Deployment (When Ready)

**Backend → Railway**
1. Push backend to GitHub
2. Connect repo to Railway.app
3. Set environment variables (SUPABASE_URL, JWT_SECRET, etc.)
4. Railway gives you a URL like: `https://mario-backend.up.railway.app`

**Frontends → Vercel**
1. Push each app folder to GitHub (separate repos)
2. Connect to Vercel.com
3. Set `VITE_API_URL=https://mario-backend.up.railway.app/api`
4. Deploy — Vercel gives you a free URL

---

## Socket.io — Live Updates

The Dispatcher app connects to your backend via WebSocket.
Your backend must set up Socket.io like this:

```javascript
// server.js
const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:3002'], credentials: true }
})

// When driver updates status, emit to all connected dispatchers:
// (Call this inside your PATCH /deliveries/:id/status controller)
io.emit('delivery:updated', { id, tracking_code, status, driver_name })
```

The dispatcher frontend listens for `delivery:updated` and updates
the table row instantly without any page refresh.
