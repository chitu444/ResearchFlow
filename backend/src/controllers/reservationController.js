import Reservation from '../models/Reservation.js';
import Equipment from '../models/Equipment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { audit } from '../utils/audit.js';
import { emitEvent } from '../utils/socket.js';
import { withEquipmentLock } from '../utils/bookingLock.js';

async function conflict(equipment, start, end, ignore) {
  return Reservation.findOne({
    equipment,
    startTime: { $lt: end },
    endTime: { $gt: start },
    status: { $in: ['Pending', 'Approved'] },
    ...(ignore ? { _id: { $ne: ignore } } : {}),
  });
}

export async function list(req, res, next) {
  try {
    const query = req.user.role === 'researcher' ? { requestedBy: req.user._id } : {};
    const reservations = await Reservation.find(query)
      .populate('equipment', 'name model status location')
      .populate('experiment', 'title status')
      .populate('requestedBy', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort('startTime');
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { equipment, startTime, endTime, experiment, notes } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!startTime || !endTime || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Valid start and end times are required.' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be strictly after start time.' });
    }

    // Disallow booking in the past (allow a 5-minute buffer for network/clock differences)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (start < fiveMinutesAgo) {
      return res.status(400).json({ message: 'Reservations cannot be scheduled in the past.' });
    }

    const result = await withEquipmentLock(equipment, async () => {
      const eq = await Equipment.findById(equipment);
      if (!eq) {
        const err = new Error('Equipment not found');
        err.status = 404;
        throw err;
      }

      if (['Maintenance', 'Retired'].includes(eq.status)) {
        const err = new Error(`Equipment is currently in ${eq.status.toLowerCase()} status and unavailable.`);
        err.status = 409;
        throw err;
      }

      const existingConflict = await conflict(equipment, start, end);
      if (existingConflict) {
        const err = new Error('The selected instrument already has a conflicting reservation during this time window.');
        err.status = 409;
        throw err;
      }

      const r = await Reservation.create({
        equipment,
        startTime: start,
        endTime: end,
        experiment: experiment || null,
        notes,
        requestedBy: req.user._id,
        status: 'Pending',
      });

      await audit(req, 'reservation.created', 'Reservation', r._id, { equipment, startTime, endTime });

      const managers = await User.find({ role: 'lab_manager', active: true });
      for (const manager of managers) {
        await Notification.create({
          recipient: manager._id,
          title: 'New reservation request',
          message: `${req.user.name} requested time on ${eq.name}.`,
          type: 'reservation',
          resourceType: 'Reservation',
          resourceId: r._id.toString(),
        });
        emitEvent('notification:new', { recipient: manager._id.toString(), id: r._id.toString() });
      }

      emitEvent('reservation:changed', { id: r._id.toString(), equipment: equipment.toString(), status: r.status });
      return r;
    });

    const populated = await result.populate('equipment experiment requestedBy', 'name model title email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function review(req, res, next) {
  try {
    const current = await Reservation.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const result = await withEquipmentLock(current.equipment, async () => {
      const r = await Reservation.findById(req.params.id).populate('equipment requestedBy', 'name model email');
      if (!r) {
        const err = new Error('Reservation not found');
        err.status = 404;
        throw err;
      }

      if (!['Approved', 'Rejected'].includes(req.body.status)) {
        const err = new Error('Review status must be either Approved or Rejected');
        err.status = 400;
        throw err;
      }

      if (req.body.status === 'Approved' && (await conflict(r.equipment._id, r.startTime, r.endTime, r._id))) {
        const err = new Error('Cannot approve: time range now conflicts with another approved reservation');
        err.status = 409;
        throw err;
      }

      r.status = req.body.status;
      r.reviewedBy = req.user._id;
      r.reviewedAt = new Date();
      await r.save();

      await Notification.create({
        recipient: r.requestedBy._id,
        title: `Reservation ${r.status.toLowerCase()}`,
        message: `Your reservation for ${r.equipment.name} was ${r.status.toLowerCase()}.`,
        type: 'reservation',
        resourceType: 'Reservation',
        resourceId: r._id.toString(),
      });
      emitEvent('notification:new', { recipient: r.requestedBy._id.toString(), id: r._id.toString() });

      await audit(req, 'reservation.reviewed', 'Reservation', r._id, { status: r.status });
      emitEvent('reservation:changed', {
        id: r._id.toString(),
        equipment: r.equipment._id.toString(),
        status: r.status,
      });

      return r;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('equipment requestedBy', 'name model email');
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const isPrivileged = ['lab_manager', 'institution_admin'].includes(req.user.role);
    const isOwner = reservation.requestedBy._id.toString() === req.user._id.toString();

    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ message: 'You can only cancel your own reservations' });
    }

    if (['Cancelled', 'Completed'].includes(reservation.status)) {
      return res.status(400).json({ message: `Reservation is already ${reservation.status.toLowerCase()}` });
    }

    reservation.status = 'Cancelled';
    await reservation.save();

    await audit(req, 'reservation.cancelled', 'Reservation', reservation._id);
    emitEvent('reservation:changed', {
      id: reservation._id.toString(),
      equipment: reservation.equipment._id.toString(),
      status: 'Cancelled',
    });

    res.json(reservation);
  } catch (error) {
    next(error);
  }
}
