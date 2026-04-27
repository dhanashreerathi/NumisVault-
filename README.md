# NumisVault — React + Node.js Migration

A full migration of NumisVault from vanilla HTML/CSS/JS into **React (Vite)** on the frontend and **Node.js (Express)** on the backend. Supabase and Cloudflare remain the backend services — the Node.js server acts as a secure proxy so the Supabase key is never exposed to the browser.

---

## Project Structure

```
numisvault/
├── frontend/     ← React + Vite + Tailwind (deploys to Cloudflare Pages)
└── backend/      ← Node.js + Express proxy (deploys to Railway / Render / any VPS)
```

---

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```

Fill in `.env`:
```
PORT=4000
SUPABASE_URL=https://msoipwxvazoppikkggex.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_URL=http://localhost:5173
CLOUDFLARE_WORKER_URL=https://numisvault-ai.pranav-chandak1.workers.dev
```

> ⚠️ **Never commit `.env` to git.** The Supabase keys stay server-side only.

### 3. Run locally
```bash
npm run dev      # nodemon (auto-restart)
# or
npm start        # production
```

Backend runs on `http://localhost:4000`.

### 4. Deploy (Railway / Render / VPS)
- Set all environment variables in your hosting dashboard
- Set `FRONTEND_URL` to your live Cloudflare Pages URL (e.g. `https://numisvault.pages.dev`)
- Start command: `npm start`

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Create your `.env` file
```bash
cp .env.example .env
```

Fill in `.env`:
```
VITE_API_URL=http://localhost:4000
```

For production, set `VITE_API_URL` to your live backend URL (e.g. `https://numisvault-api.railway.app`).

### 3. Run locally
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`. The Vite dev proxy automatically forwards all `/api` calls to `http://localhost:4000`, so both servers work together seamlessly.

### 4. Build for production
```bash
npm run build
```

Output goes to `frontend/dist/`. Deploy this folder to Cloudflare Pages.

### 5. Deploy to Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `dist`
- Add environment variable: `VITE_API_URL=https://your-backend-url.com`
- The `public/_redirects` file ensures React Router works (`/* /index.html 200`)
- The `public/_headers` file sets all original security headers

> ⚠️ Update the `Content-Security-Policy` in `public/_headers` to include your live backend URL in the `connect-src` directive.

---

## Architecture

```
Browser (React)
    │
    │  fetch('/api/...')   ← all Supabase calls go through here
    ▼
Node.js Backend (Express)
    │  validates JWT, applies RLS, calls Supabase with server-side key
    ├── Supabase (database, auth, RLS)
    └── Cloudflare Worker (AI image extraction + R2 upload)
```

**Key security improvement:** The Supabase anon key and service role key live only in the Node.js server's environment variables. The React frontend never sees them.

---

## Feature Parity Checklist

| Feature | Original | Migrated |
|---|---|---|
| Currency note + coin gallery | ✅ | ✅ |
| Filter by type, country, decade, era | ✅ | ✅ |
| Direct item links (`?item=N00001`) | ✅ | ✅ |
| Image zoom on hover | ✅ | ✅ |
| Mobile image carousel | ✅ | ✅ |
| Sign up / Sign in / Sign out | ✅ | ✅ |
| Email verification + resend (rate limited) | ✅ | ✅ |
| Forgot password / reset via email | ✅ | ✅ |
| Ban check on login | ✅ | ✅ |
| Wishlist (add / remove) | ✅ | ✅ |
| Contact owner (inquiry system) | ✅ | ✅ |
| Notification bell (admin + user views) | ✅ | ✅ |
| Notification history toggle | ✅ | ✅ |
| Profile: name, phone, country, DOB, focus | ✅ | ✅ |
| Settings: alerts, share email, change password | ✅ | ✅ |
| Account deletion | ✅ | ✅ |
| Admin: user table with search | ✅ | ✅ |
| Admin: ban / unban users | ✅ | ✅ |
| Admin: collector detail modal | ✅ | ✅ |
| Admin: vault upload form | ✅ | ✅ |
| Admin: AI image extract + R2 upload | ✅ | ✅ |
| Floating currency symbols animation | ✅ | ✅ |
| Route guards (auth + admin) | ✅ | ✅ |
| React Router (replaces hash routing) | — | ✅ |
| Supabase key server-side only | — | ✅ |
| Cloudflare Pages `_headers` + `_redirects` | ✅ | ✅ |
