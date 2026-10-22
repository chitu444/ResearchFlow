# Deployment

## MongoDB Atlas
Create a cluster and database user. Add the Atlas connection string as `MONGO_URI`.

## Backend
Set `NODE_ENV=production`, a strong random `JWT_SECRET`, `MONGO_URI`, `CLIENT_URL`, and an appropriate upload strategy. Deploy `backend` as a Node service using `npm install` then `npm start`.

## Frontend
Set `VITE_API_URL` to the deployed backend `/api` URL and `VITE_SOCKET_URL` to the backend origin. Run `npm install && npm run build`; serve `dist` with the included Nginx configuration or a static hosting provider.

## Production uploads
The included local disk uploader is appropriate for development/demo use. For horizontally scaled production, replace local filesystem storage with an object store and retain the same Dataset metadata API.

## Security checklist
- Rotate JWT secret.
- Use a restrictive `CLIENT_URL`.
- Use HTTPS.
- Review allowed upload types/size.
- Use a dedicated MongoDB user with least privilege.
- Do not seed development credentials in production.
