import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { audit } from '../utils/audit.js';

const tokenFor = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password, role = 'researcher', department, laboratory } = req.body;

    if (role !== 'researcher' && req.user?.role !== 'institution_admin') {
      return res.status(403).json({ message: 'Only admins may create privileged roles' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      department: department || null,
      laboratory: laboratory || null,
    });

    await audit(req, 'user.created', 'User', user._id, { role, email: user.email });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        laboratory: user.laboratory,
      },
      token: tokenFor(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Enter a valid email and password', errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact an administrator.' });
    }

    const valid = await bcrypt.compare(String(password || ''), user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    await audit(req, 'user.login', 'User', user._id);

    res.json({
      token: tokenFor(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        laboratory: user.laboratory,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
