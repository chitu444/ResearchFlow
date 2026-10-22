import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import Dataset from '../models/Dataset.js';
import { audit } from '../utils/audit.js';
import { emitEvent } from '../utils/socket.js';

async function parseCsv(filePath) {
  try {
    const raw = await fsPromises.readFile(filePath, 'utf8');
    const lines = raw.trim().split(/\r?\n/).slice(0, 501);
    if (lines.length < 2) return null;

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) =>
      line.split(',').map((cell) => {
        const val = cell.trim();
        const num = Number(val);
        return Number.isFinite(num) && val !== '' ? num : val;
      })
    );

    const numeric = headers
      .map((header, index) => ({ header, index }))
      .filter((col) => rows.some((row) => typeof row[col.index] === 'number'));

    if (!numeric.length) return null;

    return {
      headers,
      rows: rows.slice(0, 200),
      numeric,
    };
  } catch (error) {
    console.error('CSV parse error:', error.message);
    return null;
  }
}

export async function list(req, res, next) {
  try {
    const query = req.user.role === 'researcher' ? { uploadedBy: req.user._id } : {};
    const datasets = await Dataset.find(query)
      .populate('experiment', 'title status')
      .populate('equipment', 'name model')
      .populate('uploadedBy', 'name email role')
      .sort('-createdAt');
    res.json(datasets);
  } catch (error) {
    next(error);
  }
}

export async function uploadDataset(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    const { experiment, equipment, metadata } = req.body;
    let parsedMeta = {};
    if (metadata) {
      try {
        parsedMeta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      } catch {
        parsedMeta = {};
      }
    }

    const dataset = await Dataset.create({
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extension: path.extname(req.file.originalname).toLowerCase(),
      experiment,
      equipment: equipment || null,
      uploadedBy: req.user._id,
      metadata: parsedMeta,
    });

    await audit(req, 'dataset.uploaded', 'Dataset', dataset._id, {
      file: req.file.originalname,
      size: req.file.size,
    });

    emitEvent('dataset:uploaded', { id: dataset._id, name: dataset.originalName });
    res.status(201).json(dataset);
  } catch (error) {
    next(error);
  }
}

export async function detail(req, res, next) {
  try {
    const dataset = await Dataset.findById(req.params.id)
      .populate('experiment', 'title status researchObjective')
      .populate('equipment', 'name model detectorType location')
      .populate('uploadedBy', 'name email role');

    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    let visualization = null;
    if (dataset.extension === '.csv' && dataset.path) {
      visualization = await parseCsv(dataset.path);
    }

    res.json({ dataset, visualization });
  } catch (error) {
    next(error);
  }
}

export async function download(req, res, next) {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    if (!fs.existsSync(dataset.path)) {
      return res.status(404).json({ message: 'Dataset file is missing from server storage' });
    }

    res.download(dataset.path, dataset.originalName);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    const isPrivileged = ['lab_manager', 'institution_admin'].includes(req.user.role);
    const isOwner = dataset.uploadedBy.toString() === req.user._id.toString();

    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ message: 'You can only delete your own datasets' });
    }

    // Try to unlink the file from storage
    if (dataset.path && fs.existsSync(dataset.path)) {
      try {
        await fsPromises.unlink(dataset.path);
      } catch (err) {
        console.warn('Could not remove file from disk:', err.message);
      }
    }

    await dataset.deleteOne();
    await audit(req, 'dataset.deleted', 'Dataset', dataset._id, { name: dataset.originalName });
    emitEvent('dataset:deleted', { id: dataset._id });

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    next(error);
  }
}
