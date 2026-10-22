# ResearchFlow

ResearchFlow is a portfolio/viva-ready MERN research-institution management platform for experiment planning, equipment scheduling, detector data, collaboration, notifications, auditability, and research intelligence.

## Stack
- React + Vite + React Router + Axios + Recharts + Context API
- Node.js + Express + Mongoose + MongoDB Atlas
- JWT + bcrypt authentication and backend RBAC
- Multer uploads, Socket.io real-time events
- Helmet, CORS, dotenv, express-validator
- Custom responsive CSS with a modern SaaS design inspired by the previously supplied HTML/CSS reference: muted red/purple/lavender/olive/brown accents, strong card hierarchy, compact spacing, responsive sidebar/mobile navigation, and light/dark themes.

## Roles
- `researcher`
- `lab_manager`
- `institution_admin`

There is **no role selector on login**. The API loads the role from the authenticated database user and redirects accordingly.

## Development credentials
All seeded users use password `ResearchFlow@123` in development:
- admin@researchflow.com / ResearchFlow@123
- manager@researchflow.com / ResearchFlow@123
- researcher@researchflow.com / ResearchFlow@123

Change these credentials before production use.

## Prerequisites
Node.js 20+, npm, and MongoDB 7+ or MongoDB Atlas.

## Setup
1. Copy `backend/.env.example` to `backend/.env` and configure MongoDB/JWT.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not on `http://localhost:5000/api`.
3. Install dependencies:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
4. Seed development data: `cd backend && npm run seed`
5. Start backend: `npm run dev`
6. Start frontend in another terminal: `cd frontend && npm run dev`
7. Open the Vite URL shown by the frontend.

## Environment
Backend variables are documented in `backend/.env.example`. Do not commit `.env` or secrets.

## Uploads
Detector datasets are uploaded through Multer to `backend/uploads` in development. The route validates extension and size and associates each dataset with an experiment, equipment, uploader, metadata, and optional version.

For production, replace local storage with object storage and keep the same Dataset service/controller contract.

## Docker
`docker-compose.yml` runs MongoDB, backend, and frontend. The frontend container is served by Nginx after `npm run build`.

## Verification
The generated source was checked for project structure, JSON/package validity, JavaScript syntax, route registration consistency, model/controller imports, and frontend/backend API configuration. A full dependency installation/build depends on the environment having npm registry/network access; the ZIP does not include node_modules.

## Documentation
- `docs/API_DOCUMENTATION.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
