import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id).select('-password');

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Invalid or inactive account' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session token' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions for this action' });
    }
    next();
  };
}
