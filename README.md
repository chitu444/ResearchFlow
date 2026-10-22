ResearchFlow is a portfolio/viva-ready MERN research-institution management platform for experiment planning, equipment scheduling, detector data, collaboration, notifications, auditability, and research intelligence.

- React + Vite + React Router + Axios + Recharts + Context API
- Node.js + Express + Mongoose + MongoDB Atlas
- JWT + bcrypt authentication and backend RBAC
- Multer uploads, Socket.io real-time events
- Helmet, CORS, dotenv, express-validator
- Custom responsive CSS with a modern SaaS design inspired by the previously supplied HTML/CSS reference: muted red/purple/lavender/olive/brown accents, strong card hierarchy, compact spacing, responsive sidebar/mobile navigation, and light/dark themes.

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


## Docker
`docker-compose.yml` runs MongoDB, backend, and frontend. The frontend container is served by Nginx after `npm run build`.


## Documentation
check docs for more info.

## 

For other quieries, contact me at chitu69420@gmail.com personally.
