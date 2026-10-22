# Database Schema

MongoDB collections are Mongoose models.

- **User**: identity, hashed password, role, department/laboratory references.
- **Department**: institution department.
- **Laboratory**: department child with location/code.
- **Equipment**: detector/instrument inventory, lifecycle and utilization.
- **Experiment**: research objective, members, equipment, lab, lifecycle status and current version.
- **ExperimentVersion**: immutable version snapshot + change details + actor.
- **Reservation**: equipment time range, experiment, requester, approval status and reviewer.
- **Dataset**: uploaded file, experiment/equipment/uploader references, detector metadata and version pointer.
- **Comment**: experiment collaboration notes.
- **Task**: experiment tasks and assignees.
- **Notification**: per-user unread/read event messages.
- **AuditLog**: actor/action/resource/timestamp/details.

Reservation conflict query: same equipment AND `existing.startTime < requested.endTime` AND `existing.endTime > requested.startTime`, limited to Pending/Approved states.
