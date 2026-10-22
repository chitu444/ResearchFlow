# Reservation concurrency protection

ResearchFlow now serializes reservation creation and approval per equipment using an atomic MongoDB `BookingLock` document. The unique equipment index makes competing lock acquisition attempts converge on one owner; other requests retry briefly and return HTTP 409 if the lock remains busy.

While the lock is held, the server re-checks equipment state and overlapping Pending/Approved reservations before writing the reservation. Approval uses the same lock, so a booking cannot be approved based on a stale conflict check.

The lock is a short lease and is released in a `finally` block. The lease prevents a crashed process from holding an instrument indefinitely. MongoDB Atlas / replica-set deployment is recommended for production.
