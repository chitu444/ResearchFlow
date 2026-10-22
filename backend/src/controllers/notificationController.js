import Notification from '../models/Notification.js';
import { emitEvent } from '../utils/socket.js';

export async function list(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(100);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

export async function read(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    emitEvent('notification:read', {
      id: notification._id.toString(),
      recipient: req.user._id.toString(),
    });

    res.json(notification);
  } catch (error) {
    next(error);
  }
}

export async function readAll(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });

    emitEvent('notification:all-read', { recipient: req.user._id.toString() });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}
