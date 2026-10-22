# ResearchFlow Functional Audit — Release Fix

## Verified in this audit
- Backend JavaScript: all `backend/src/**/*.js` files pass `node --check`.
- Frontend + backend source: all JS/JSX files parse successfully with Babel's module + JSX parser.
- React effect cleanup audit: no `useEffect(load, ...)` or `useEffect(async ...)` patterns remain.
- Fixed the React `safelyCallDestroy` crash caused by Promise-returning effect callbacks on Dashboard, Experiments, Labs, Reservations, and Experiment Detail.
- Socket lifecycle cleanup now removes registered listeners before disconnecting.
- Login email is trimmed/lower-cased in the frontend and normalized by Express validation/backend lookup.
- Local API/socket endpoints are consistently configured for `127.0.0.1`.
- Frontend API paths were cross-checked against backend route definitions.
- Equipment, reservation, experiment, dataset, lab, notification, analytics, and auth route pairs were checked for matching paths/methods.
- Dataset browser download now keeps the object URL alive briefly after triggering the download.
- Demo seed repairs the three documented demo credentials without duplicating the demo research dataset once the demo department exists.

## Runtime limitations of this audit environment
- A local MongoDB server was not available, so live database/E2E authentication and CRUD tests could not be executed here.
- The production Vite build could not be completed in this Linux audit environment because the supplied dependency tree is Windows-platform-specific and npm dependency installation timed out. The source itself passed the Babel JSX/module parse audit.

## Demo credentials
- admin@researchflow.com / ResearchFlow@123
- manager@researchflow.com / ResearchFlow@123
- researcher@researchflow.com / ResearchFlow@123
