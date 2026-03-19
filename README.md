# Civil Registrar — Netlify-Ready Web App

Full conversion of the Flask/Jinja app into a **React frontend + Flask REST API** architecture deployable on Netlify (frontend) and Render/Railway (backend API).

---

## Folder Structure

```
civil-registrar/
├── netlify.toml                  ← Netlify build config
│
├── frontend/                     ← React app (deploy to Netlify)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   └── _redirects            ← SPA routing for Netlify
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               ← Routes
│       ├── index.css             ← Global styles
│       ├── context/
│       │   └── AuthContext.jsx   ← Login state
│       ├── utils/
│       │   └── api.js            ← Axios instance
│       ├── components/
│       │   ├── AdminLayout.jsx   ← Sidebar shell
│       │   └── AdminLayout.css
│       └── pages/
│           ├── Landing.jsx       ← Public home page
│           ├── Landing.css
│           ├── AnnouncementView.jsx
│           ├── Login.jsx
│           ├── Login.css
│           ├── Dashboard.jsx     ← Charts + KPIs
│           ├── Dashboard.css
│           ├── Transactions.jsx
│           ├── TransactionForm.jsx
│           ├── Services.jsx
│           ├── ServiceForm.jsx
│           ├── Achievements.jsx
│           ├── AchievementForm.jsx
│           ├── Announcements.jsx
│           ├── AnnouncementForm.jsx
│           └── Reports.jsx
│
└── api/                          ← Flask REST API (deploy to Render/Railway)
    ├── app.py
    ├── requirements.txt
    └── render.yaml
```

---

## Local Development

### 1. Start the Flask API

```bash
cd api
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# API runs at http://localhost:5000
```

Default admin credentials: **admin / admin123**

### 2. Start the React frontend

```bash
cd frontend
cp .env.example .env.local
# .env.local already points to http://localhost:5000/api
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Deploy to Netlify + Render

### Step 1 — Deploy the API to Render

1. Create a free account at [render.com](https://render.com)
2. New → **Web Service** → connect your GitHub repo
3. Set:
   - **Root Directory**: `api`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. Add environment variables:
   - `SECRET_KEY` → any random string
   - `FRONTEND_URL` → your Netlify URL (set after step 2)
5. Deploy. Note your API URL: `https://your-app.onrender.com`

### Step 2 — Deploy the Frontend to Netlify

1. Create a free account at [netlify.com](https://netlify.com)
2. **Add new site** → Import from Git → select your repo
3. Netlify auto-detects `netlify.toml`. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variable in Netlify dashboard:
   - `VITE_API_URL` → `https://your-app.onrender.com/api`
5. Deploy site.

### Step 3 — Update CORS on Render

Go back to Render → your API service → Environment:
- Update `FRONTEND_URL` to your actual Netlify URL (e.g. `https://civil-registrar.netlify.app`)
- Redeploy.

---

## Environment Variables

### Frontend (`frontend/.env.local`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL to Flask API /api | `https://your-app.onrender.com/api` |

### API (Render environment)
| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask secret key (random string) |
| `FRONTEND_URL` | Your Netlify site URL (for CORS) |
| `DATABASE_URL` | Optional — defaults to SQLite. Use PostgreSQL URL for production. |

---

## Pages & Routes

### Public
| Path | Page |
|---|---|
| `/` | Landing page (services, announcements, achievements, contact) |
| `/announcement/:id` | Single announcement view |

### Admin (requires login)
| Path | Page |
|---|---|
| `/admin/login` | Login |
| `/admin/dashboard` | Dashboard with 5 charts + KPIs |
| `/admin/transactions` | Transaction list with filters |
| `/admin/transactions/new` | Create transaction |
| `/admin/transactions/:id/edit` | Edit transaction |
| `/admin/services` | Services list |
| `/admin/services/new` | Create service |
| `/admin/services/:id/edit` | Edit service |
| `/admin/achievements` | Achievements list |
| `/admin/achievements/new` | Create achievement |
| `/admin/achievements/:id/edit` | Edit achievement |
| `/admin/announcements` | Announcements list |
| `/admin/announcements/new` | Create announcement |
| `/admin/announcements/:id/edit` | Edit announcement |
| `/admin/reports` | Reports + CSV/PDF export |

## API Endpoints

### Auth
- `POST /api/auth/login` — `{ username, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Transactions
- `GET    /api/transactions` — supports `?q=&service_id=&status=&start_date=&end_date=`
- `POST   /api/transactions`
- `PUT    /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET    /api/transactions/:id/qr` — returns QR code PNG

### Services
- `GET    /api/services`
- `POST   /api/services` *(auth)*
- `PUT    /api/services/:id` *(auth)*
- `DELETE /api/services/:id` *(auth)*

### Announcements
- `GET    /api/announcements` — supports `?active=1`
- `GET    /api/announcements/:id`
- `POST   /api/announcements` *(auth, multipart)*
- `PUT    /api/announcements/:id` *(auth, multipart)*
- `DELETE /api/announcements/:id` *(auth)*

### Achievements
- `GET    /api/achievements` — supports `?active=1`
- `POST   /api/achievements` *(auth)*
- `PUT    /api/achievements/:id` *(auth)*
- `DELETE /api/achievements/:id` *(auth)*

### Reports
- `GET /api/reports/transactions` — supports `?start=&end=`
- `GET /api/reports/transactions.csv`
- `GET /api/reports/transactions.pdf`
- `GET /api/reports/top-services.csv`
