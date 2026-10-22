import Equipment from '../models/Equipment.js';
import Reservation from '../models/Reservation.js';
import { audit } from '../utils/audit.js';
import { emitEvent } from '../utils/socket.js';

export async function list(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [equipmentList, recentReservations] = await Promise.all([
      Equipment.find()
        .populate('laboratory', 'name code location')
        .populate('maintenanceHistory.performedBy', 'name email')
        .sort('name'),
      Reservation.find({
        status: { $in: ['Approved', 'Completed'] },
        startTime: { $gte: thirtyDaysAgo },
      }).select('equipment startTime endTime'),
    ]);

    // Map booked hours per instrument over past 30 days
    const hoursByEquipment = {};
    recentReservations.forEach((r) => {
      const eqId = r.equipment.toString();
      const hrs = Math.max(0, (new Date(r.endTime) - new Date(r.startTime)) / 36e5);
      hoursByEquipment[eqId] = (hoursByEquipment[eqId] || 0) + hrs;
    });

    // Standard available lab hours in 30 days: 30 days * 8 hrs/day = 240 hours
    const standardFacilityHours = 240;
    const now = new Date();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 86400000);

    const enriched = equipmentList.map((eq) => {
      const plain = eq.toObject();
      const bookedHours = hoursByEquipment[eq._id.toString()] || 0;

      // Calculate dynamic utilization if there are active bookings, otherwise keep recorded utilization
      const dynamicUtil = Math.min(100, Math.round((bookedHours / standardFacilityHours) * 100));
      plain.computedUtilization = Math.max(plain.utilization || 0, dynamicUtil);
      plain.recentBookedHours = Number(bookedHours.toFixed(1));

      // Calibration status
      if (plain.nextCalibration) {
        const calibDate = new Date(plain.nextCalibration);
        if (calibDate < now) {
          plain.calibrationStatus = 'expired';
          plain.calibrationAlert = true;
        } else if (calibDate <= fourteenDaysFromNow) {
          plain.calibrationStatus = 'due_soon';
          plain.calibrationAlert = true;
        } else {
          plain.calibrationStatus = 'valid';
          plain.calibrationAlert = false;
        }
      } else {
        plain.calibrationStatus = 'unscheduled';
        plain.calibrationAlert = false;
      }

      return plain;
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const equipment = await Equipment.create(req.body);
    await audit(req, 'equipment.created', 'Equipment', equipment._id, { name: equipment.name });
    emitEvent('equipment:availability', { id: equipment._id.toString(), status: equipment.status });
    res.status(201).json(await equipment.populate('laboratory', 'name code location'));
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('laboratory', 'name code location');

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    await audit(req, 'equipment.updated', 'Equipment', equipment._id, { changes: req.body });
    emitEvent('equipment:availability', { id: equipment._id.toString(), status: equipment.status });
    res.json(equipment);
  } catch (error) {
    next(error);
  }
}

export async function addMaintenance(req, res, next) {
  try {
    const { description, status, date, nextCalibration } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Maintenance description is required' });
    }

    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    equipment.maintenanceHistory.push({
      date: date ? new Date(date) : new Date(),
      description: description.trim(),
      performedBy: req.user._id,
    });

    if (status && ['Purchased', 'Installed', 'Calibrated', 'Active', 'Maintenance', 'Retired'].includes(status)) {
      equipment.status = status;
    }
    if (nextCalibration) {
      equipment.nextCalibration = new Date(nextCalibration);
    }

    await equipment.save();
    await audit(req, 'equipment.maintenance.logged', 'Equipment', equipment._id, { description, status });
    emitEvent('equipment:availability', { id: equipment._id.toString(), status: equipment.status });

    const populated = await equipment.populate([
      { path: 'laboratory', select: 'name code location' },
      { path: 'maintenanceHistory.performedBy', select: 'name email' },
    ]);

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const hasActiveReservations = await Reservation.exists({
      equipment: equipment._id,
      status: { $in: ['Pending', 'Approved'] },
    });

    if (hasActiveReservations) {
      return res.status(409).json({ message: 'Cannot delete equipment with active or pending reservations.' });
    }

    await equipment.deleteOne();
    await audit(req, 'equipment.deleted', 'Equipment', equipment._id);
    emitEvent('equipment:availability', { id: equipment._id.toString(), status: 'Deleted' });

    res.json({ message: 'Equipment deleted' });
  } catch (error) {
    next(error);
  }
}
