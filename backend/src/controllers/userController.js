import User from '../models/User.js';
import Experiment from '../models/Experiment.js';
import Reservation from '../models/Reservation.js';
import Dataset from '../models/Dataset.js';
import { audit } from '../utils/audit.js';

export async function listUsers(req, res, next) {
  try {
    const users = await User.find()
      .select('-password')
      .populate('department', 'name code')
      .populate('laboratory', 'name code')
      .sort('name');
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, department, laboratory, active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent removing the last active institution_admin
    if (user.role === 'institution_admin' && (role !== 'institution_admin' || active === false)) {
      const adminCount = await User.countDocuments({ role: 'institution_admin', active: true });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate or change role of the sole remaining institution admin' });
      }
    }

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (laboratory !== undefined) user.laboratory = laboratory || null;
    if (active !== undefined) user.active = Boolean(active);

    await user.save();
    await audit(req, 'user.updated', 'User', user._id, { role, active, department, laboratory });

    const updated = await User.findById(id)
      .select('-password')
      .populate('department', 'name code')
      .populate('laboratory', 'name code');

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Check if user has associated research records
    const [hasExp, hasRes, hasData] = await Promise.all([
      Experiment.exists({ createdBy: user._id }),
      Reservation.exists({ requestedBy: user._id }),
      Dataset.exists({ uploadedBy: user._id })
    ]);

    if (hasExp || hasRes || hasData) {
      // Deactivate instead of hard deleting to preserve referential integrity
      user.active = false;
      await user.save();
      await audit(req, 'user.deactivated', 'User', user._id, { reason: 'Has associated research records' });
      return res.json({ message: 'User deactivated to preserve historical research records', deactivated: true });
    }

    await user.deleteOne();
    await audit(req, 'user.deleted', 'User', user._id);
    res.json({ message: 'User removed permanently', deleted: true });
  } catch (error) {
    next(error);
  }
}
