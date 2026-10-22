import Department from '../models/Department.js';
import Laboratory from '../models/Laboratory.js';
import Equipment from '../models/Equipment.js';
import { audit } from '../utils/audit.js';
import { emitEvent } from '../utils/socket.js';

export async function departments(req, res, next) {
  try {
    res.json(await Department.find().sort('name'));
  } catch (error) {
    next(error);
  }
}

export async function laboratories(req, res, next) {
  try {
    res.json(await Laboratory.find().populate('department', 'name code').sort('name'));
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const department = await Department.create(req.body);
    await audit(req, 'department.created', 'Department', department._id, { name: department.name });
    emitEvent('institution:changed', { type: 'department', action: 'created', id: department._id.toString() });
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    await audit(req, 'department.updated', 'Department', department._id, { changes: req.body });
    emitEvent('institution:changed', { type: 'department', action: 'updated', id: department._id.toString() });
    res.json(department);
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req, res, next) {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const hasLabs = await Laboratory.exists({ department: department._id });
    if (hasLabs) {
      return res.status(409).json({ message: 'Remove all laboratories before deleting this department.' });
    }

    await department.deleteOne();
    await audit(req, 'department.deleted', 'Department', department._id);
    emitEvent('institution:changed', { type: 'department', action: 'deleted', id: department._id.toString() });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createLaboratory(req, res, next) {
  try {
    const laboratory = await Laboratory.create(req.body);
    await audit(req, 'laboratory.created', 'Laboratory', laboratory._id, { name: laboratory.name });
    emitEvent('institution:changed', { type: 'laboratory', action: 'created', id: laboratory._id.toString() });
    res.status(201).json(await laboratory.populate('department', 'name code'));
  } catch (error) {
    next(error);
  }
}

export async function updateLaboratory(req, res, next) {
  try {
    const laboratory = await Laboratory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name code');

    if (!laboratory) {
      return res.status(404).json({ message: 'Laboratory not found' });
    }

    await audit(req, 'laboratory.updated', 'Laboratory', laboratory._id, { changes: req.body });
    emitEvent('institution:changed', { type: 'laboratory', action: 'updated', id: laboratory._id.toString() });
    res.json(laboratory);
  } catch (error) {
    next(error);
  }
}

export async function deleteLaboratory(req, res, next) {
  try {
    const laboratory = await Laboratory.findById(req.params.id);
    if (!laboratory) {
      return res.status(404).json({ message: 'Laboratory not found' });
    }

    const hasEquipment = await Equipment.exists({ laboratory: laboratory._id });
    if (hasEquipment) {
      return res.status(409).json({ message: 'Reassign or remove equipment before deleting this laboratory.' });
    }

    await laboratory.deleteOne();
    await audit(req, 'laboratory.deleted', 'Laboratory', laboratory._id);
    emitEvent('institution:changed', { type: 'laboratory', action: 'deleted', id: laboratory._id.toString() });
    res.json({ message: 'Laboratory deleted successfully' });
  } catch (error) {
    next(error);
  }
}
