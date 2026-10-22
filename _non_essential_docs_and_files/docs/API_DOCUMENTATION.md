# API Documentation

Base URL: `/api`

All endpoints (except `/auth/login` and `/health`) require `Authorization: Bearer <JWT>` header.

## Auth
- `POST /auth/login` — `{ email, password }` with rate limiting; returns JWT + database-derived role.
- `GET /auth/me` — Authenticated profile.
- `POST /auth/register` — Institution Admin only; creates new accounts with assigned roles, departments, and labs.

## Users & Access Control (Institution Admin)
- `GET /users` — List institutional accounts with populated department and lab references.
- `PATCH /users/:id` — Update role, department, lab, and active/inactive status.
- `DELETE /users/:id` — Safely remove or deactivate account while preserving research audit integrity.

## Experiments
- `GET /experiments` — List visible experiments (researchers see their own + assigned; managers/admins see all).
- `POST /experiments` — Create experiment with version 1.
- `GET /experiments/:id` — Detail view with version history, comments, and task milestones.
- `PATCH /experiments/:id` — Update experiment with version increment and audit logging (mass-assignment protected).
- `DELETE /experiments/:id` — Delete draft experiments (or any by admin).
- `POST /experiments/:id/comments` — Add research note.
- `POST /experiments/:id/tasks` — Add milestone or action item.
- `PATCH /experiments/:id/tasks/:taskId` — Update milestone status (`Todo`, `In Progress`, `Done`).

## Equipment & Detectors
- `GET /equipment` — List inventory with populated labs and maintenance logs.
- `POST /equipment` — Register instrument (Lab Manager / Admin).
- `PATCH /equipment/:id` — Update instrument specifications and calibration date (Lab Manager / Admin).
- `POST /equipment/:id/maintenance` — Log maintenance, service findings, calibration dates, and update status (Lab Manager / Admin).
- `DELETE /equipment/:id` — Delete instrument if no active reservations exist (Lab Manager / Admin).

## Institution Structure
- `GET /labs/departments` — List departments.
- `GET /labs/laboratories` — List laboratories with department references.
- `POST /labs/departments` — Create department (Admin).
- `PATCH /labs/departments/:id` — Update department (Admin).
- `DELETE /labs/departments/:id` — Remove empty department (Admin).
- `POST /labs/laboratories` — Create laboratory (Admin).
- `PATCH /labs/laboratories/:id` — Update laboratory (Admin).
- `DELETE /labs/laboratories/:id` — Remove empty laboratory (Admin).

## Reservations & Schedule
- `GET /reservations` — List schedule (researcher sees own; manager/admin sees facility-wide).
- `POST /reservations` — Conflict-checked with lease lock; rejects past dates and overlapping bookings.
- `PATCH /reservations/:id/review` — Approve/Reject reservation with lock validation (Lab Manager / Admin).
- `PATCH /reservations/:id/cancel` — Cancel pending/approved reservation (Owner / Lab Manager / Admin).

## Datasets & Telemetry
- `GET /datasets` — List catalogued files.
- `POST /datasets` — Multipart form upload (`file`, `experiment`, `equipment`, `metadata`).
- `GET /datasets/:id` — Metadata and parsed telemetry signal visualization.
- `GET /datasets/:id/download` — Authenticated stream download with disk validation.
- `DELETE /datasets/:id` — Delete dataset and unlinks stored file (Owner / Admin).

## Compliance & Audit Trail (Institution Admin)
- `GET /audit` — Paginated, filterable immutable system activity trail (`page`, `limit`, `action`, `resourceType`).

## Analytics & Intelligence
- `GET /analytics/overview` — Institution KPIs, equipment utilization, upload frequency, and lifecycle stats (Lab Manager / Admin).

## Notifications
- `GET /notifications` — List user notifications.
- `PATCH /notifications/:id/read` — Mark notification as read.
- `PATCH /notifications/read-all` — Mark all user notifications as read.

## System
- `GET /health` — Service readiness and server timestamp.
