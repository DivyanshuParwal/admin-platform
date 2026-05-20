# Admin Platform

Internal admin app for managing users, sites, and roles across a multi-tenant setup. Built as a full-stack assignment with a React frontend and Express API backed by MongoDB.

## Live links

| | |
|---|---|
| App | https://frontend-nu-red-50.vercel.app |
| API | https://backend-cyan-rho.vercel.app |
| Repo | https://github.com/DivyanshuParwal/admin-platform |

**Demo login:** `admin@example.com` / `Admin@12345`

## Tech stack

- **Backend:** Node.js, Express, Mongoose, JWT, bcrypt
- **Frontend:** React (Vite), React Router, Axios
- **Database:** MongoDB Atlas
- **Deploy:** Vercel (frontend + API), GitHub

## Features

- JWT login with hashed passwords
- Users linked to a **site** (tenant) and **role** (admin / manager / member)
- CRUD for users, sites, and roles (with role-based restrictions on the API and UI)
- Dashboard with counts by site and role
- Search and pagination on list pages

## Project structure

```
backend/          Express API (routes → controllers → models)
frontend/         React SPA (pages, components, api client)
```

## Run locally

**1. Backend**

```bash
cd backend
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm install
npm run seed
npm run dev
```

API runs at http://localhost:4000

**2. Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the seeded admin user.

## Environment variables

**Backend** (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `CORS_ORIGIN` | Frontend URL (default `http://localhost:5173`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Optional seed defaults |

**Frontend** (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL (default `http://localhost:4000/api`) |

See `.env.example` in each folder for the full list.

## API overview

Base path: `/api`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | Login, returns JWT |
| `GET /auth/me` | Current user |
| `GET/POST/PATCH /users` | User management |
| `GET/POST/PATCH/DELETE /sites` | Sites |
| `GET/POST/PATCH/DELETE /roles` | Roles |
| `GET /dashboard/summary` | Dashboard stats |

Authenticated requests send `Authorization: Bearer <token>`.

Paginated lists return `{ items, page, limit, total, totalPages }`.

## Deployment

Production uses **Vercel** for both the React app and the API, with **MongoDB Atlas** for data.

1. Set `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` on the backend Vercel project.
2. Set `VITE_API_BASE_URL` on the frontend project.
3. Run `npm run seed` locally once (with the same `MONGODB_URI`) to load demo data.

More detail: [DEPLOYMENT.md](./DEPLOYMENT.md).

## Author

Divyanshu Parwal
