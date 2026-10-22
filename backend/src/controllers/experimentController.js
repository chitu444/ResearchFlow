import Experiment from '../models/Experiment.js';
import ExperimentVersion from '../models/ExperimentVersion.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { audit } from '../utils/audit.js';
import { emitEvent } from '../utils/socket.js';

export async function list(req, res, next) {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};

    if (req.user.role === 'researcher') {
      filter.$or = [{ createdBy: req.user._id }, { researchers: req.user._id }];
    }

    const data = await Experiment.find(filter)
      .populate('laboratory', 'name code location')
      .populate('requiredEquipment', 'name model status')
      .populate('researchers', 'name email role')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(data);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const {
      title,
      description,
      researchObjective,
      laboratory,
      requiredEquipment,
      researchers,
      startDate,
      endDate,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Experiment title is required' });
    }

    const experiment = await Experiment.create({
      title: title.trim(),
      description,
      researchObjective,
      laboratory: laboratory || null,
      requiredEquipment: requiredEquipment || [],
      researchers: researchers?.length ? researchers : [req.user._id],
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: req.user._id,
      status: 'Draft',
      version: 1,
    });

    await ExperimentVersion.create({
      experiment: experiment._id,
      version: 1,
      changedBy: req.user._id,
      changes: { created: true },
      snapshot: experiment.toObject(),
    });

    await audit(req, 'experiment.created', 'Experiment', experiment._id, { title: experiment.title });
    emitEvent('experiment:created', { id: experiment._id, title: experiment.title });

    const populated = await experiment.populate('laboratory requiredEquipment researchers createdBy');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const experiment = await Experiment.findById(req.params.id)
      .populate('laboratory', 'name code location')
      .populate('requiredEquipment', 'name model status')
      .populate('researchers', 'name email role')
      .populate('createdBy', 'name email');

    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const [history, comments, tasks] = await Promise.all([
      ExperimentVersion.find({ experiment: experiment._id })
        .populate('changedBy', 'name email role')
        .sort('-version'),
      Comment.find({ experiment: experiment._id })
        .populate('author', 'name role')
        .sort('createdAt'),
      Task.find({ experiment: experiment._id })
        .populate('assignee createdBy', 'name email')
        .sort('createdAt'),
    ]);

    res.json({ experiment, history, comments, tasks });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const isPrivileged = ['lab_manager', 'institution_admin'].includes(req.user.role);
    const isOwner = experiment.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'You do not have permission to modify this experiment' });
    }

    // Role-based status transition validation
    if (req.body.status && req.body.status !== experiment.status) {
      if (!isPrivileged && !(req.body.status === 'Submitted' && experiment.status === 'Draft')) {
        return res.status(403).json({ message: 'Researchers may only submit draft experiments for review' });
      }
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'title',
      'description',
      'researchObjective',
      'laboratory',
      'requiredEquipment',
      'researchers',
      'startDate',
      'endDate',
      'status',
    ];

    const changes = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined && req.body[key] !== experiment[key]) {
        changes[key] = req.body[key];
        experiment[key] = req.body[key];
      }
    }

    if (Object.keys(changes).length === 0) {
      return res.json(experiment);
    }

    experiment.version += 1;
    await experiment.save();

    await ExperimentVersion.create({
      experiment: experiment._id,
      version: experiment.version,
      changedBy: req.user._id,
      changes,
      snapshot: experiment.toObject(),
    });

    await audit(req, 'experiment.updated', 'Experiment', experiment._id, { changes, version: experiment.version });
    emitEvent('experiment:updated', { id: experiment._id, status: experiment.status, version: experiment.version });

    if (changes.status === 'Approved' && experiment.createdBy) {
      await Notification.create({
        recipient: experiment.createdBy,
        title: 'Experiment approved',
        message: `Your experiment "${experiment.title}" has been approved.`,
        type: 'experiment',
        resourceType: 'Experiment',
        resourceId: experiment._id.toString(),
      });
      emitEvent('notification:new', { recipient: experiment.createdBy.toString(), id: experiment._id.toString() });
    }

    res.json(experiment);
  } catch (error) {
    next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await Comment.create({
      experiment: req.params.id,
      author: req.user._id,
      body: body.trim(),
    });

    const fullComment = await comment.populate('author', 'name role');
    await audit(req, 'experiment.comment.created', 'Comment', comment._id);
    emitEvent('experiment:comment', { experiment: req.params.id, comment: fullComment });

    res.status(201).json(fullComment);
  } catch (error) {
    next(error);
  }
}

export async function addTask(req, res, next) {
  try {
    const { title, description, assignee, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create({
      experiment: req.params.id,
      title: title.trim(),
      description,
      assignee: assignee || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
      status: 'Todo',
    });

    const fullTask = await task.populate('assignee createdBy', 'name email');
    emitEvent('experiment:task', { experiment: req.params.id, task: fullTask });

    res.status(201).json(fullTask);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, experiment: req.params.id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { status, title, assignee, dueDate } = req.body;
    if (status !== undefined) task.status = status;
    if (title !== undefined) task.title = title.trim();
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    const fullTask = await task.populate('assignee createdBy', 'name email');

    emitEvent('experiment:task', { experiment: req.params.id, task: fullTask });
    res.json(fullTask);
  } catch (error) {
    next(error);
  }
}

export async function deleteExperiment(req, res, next) {
  try {
    const experiment = await Experiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }

    const isPrivileged = ['lab_manager', 'institution_admin'].includes(req.user.role);
    const isOwner = experiment.createdBy.toString() === req.user._id.toString();

    if (!isPrivileged && (!isOwner || experiment.status !== 'Draft')) {
      return res.status(403).json({ message: 'Only draft experiments can be deleted by their creator' });
    }

    await Promise.all([
      Comment.deleteMany({ experiment: experiment._id }),
      Task.deleteMany({ experiment: experiment._id }),
      ExperimentVersion.deleteMany({ experiment: experiment._id }),
      experiment.deleteOne(),
    ]);

    await audit(req, 'experiment.deleted', 'Experiment', experiment._id, { title: experiment.title });
    emitEvent('experiment:deleted', { id: experiment._id });

    res.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    next(error);
  }
}
