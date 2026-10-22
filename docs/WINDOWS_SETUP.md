# ResearchFlow — Windows Setup

## Required

1. **Node.js LTS** — includes npm.
2. **MongoDB Community Server** — local database used by the default `.env`.

## Optional

- **MongoDB Compass** — graphical database viewer.
- **Git** — only needed if you want to clone/manage the project from Git.
- **VS Code** — recommended editor, not required to run it.

## First run

1. Extract `ResearchFlow_MERN.zip` to a normal folder, e.g. `C:\ResearchFlow`.
2. Install Node.js LTS and MongoDB Community Server.
3. Double-click `start.bat`.
4. The script creates local `.env` files, installs npm dependencies, starts MongoDB, seeds the development database once, starts backend/frontend, and opens the browser.

## Development credentials

- `admin@researchflow.com`
- `manager@researchflow.com`
- `researcher@researchflow.com`

Use the development password documented in `README.md` / seed configuration.

## URLs

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/health

## MongoDB Atlas instead of local MongoDB

Edit `backend/.env` and replace `MONGO_URI` with your Atlas connection string. Keep the rest of the local settings unless your deployment requires changes.
