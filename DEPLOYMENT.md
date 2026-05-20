# Deployment notes

Production setup:

- **Frontend:** Vercel (`frontend/`)
- **API:** Vercel (`backend/`, serverless via `api/index.js`)
- **Database:** MongoDB Atlas

## MongoDB Atlas

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Add a database user and allow network access (`0.0.0.0/0` for cloud hosts).
3. Copy the connection string and use database name `admin_platform`.

## Vercel – backend

1. Import the repo and set root directory to `backend`.
2. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = your frontend URL (e.g. `https://frontend-nu-red-50.vercel.app`)
3. Deploy.

## Vercel – frontend

1. Root directory: `frontend`
2. Set `VITE_API_BASE_URL` = `https://<your-api-host>/api`
3. Deploy (`vercel.json` handles SPA routing).

## Seed production data

From your machine (same Atlas URI as production):

```bash
cd backend
set MONGODB_URI=mongodb+srv://...
npm run seed
```

Default admin: `admin@example.com` / `Admin@12345`
