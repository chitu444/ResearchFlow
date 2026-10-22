import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

fs.mkdirSync(env.uploadDir, { recursive: true });

const allowedExtensions = [
  '.csv',
  '.json',
  '.txt',
  '.tsv',
  '.dat',
  '.log',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.tif',
  '.tiff',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported detector file type: ${ext}. Allowed: ${allowedExtensions.join(', ')}`));
    }
  },
});
