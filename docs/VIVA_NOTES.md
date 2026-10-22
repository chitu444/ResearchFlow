# Viva Talking Points

1. **Why MERN?** React supports componentized dashboards, Express gives a clean API boundary, MongoDB maps naturally to research records with flexible detector metadata, and Mongoose supplies validation/references.
2. **How is RBAC secure?** The login response carries the role from the database, but the backend middleware independently checks `req.user.role` for privileged endpoints. Frontend route guards are only a UX layer.
3. **How are booking conflicts prevented?** The API checks overlapping ranges on the same equipment before creating a reservation and repeats the check at approval time.
4. **Why version experiments?** Scientific work changes. Each update increments a version and stores the actor, timestamp, changes, and snapshot.
5. **Why Socket.io?** Reservation/equipment/dataset/experiment events can appear without refreshing the page.
6. **Why Multer?** It parses multipart file uploads and lets the server validate size/type before associating a stored file with research metadata.
7. **Why analytics?** Metrics are derived from stored records rather than hard-coded demo numbers.
