# Architecture

Browser React client communicates with Express REST APIs through Axios. JWTs identify authenticated users; Express middleware loads the user from MongoDB and applies role authorization. Mongoose models provide the domain layer. Socket.io emits meaningful events for experiment changes, reservation changes, equipment availability and dataset uploads.

Frontend layers: pages → reusable components/layouts → API service/context/hooks.
Backend layers: routes → controllers → Mongoose models/utilities, with authentication, authorization, upload and centralized error middleware.

The platform is intentionally designed around research workflow rather than generic CRUD: experiments have lifecycle + version history; reservations have overlap protection; datasets have real multipart uploads and CSV visualization; analytics are calculated from stored records; audit and notification records support traceability.
