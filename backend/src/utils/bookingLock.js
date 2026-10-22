import crypto from 'crypto';
import BookingLock from '../models/BookingLock.js';

const LOCK_MS = 12000;
const RETRIES = 10;

export async function withEquipmentLock(equipmentId, work) {
  const owner = crypto.randomUUID();

  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + LOCK_MS);

    try {
      const lock = await BookingLock.findOneAndUpdate(
        {
          equipment: equipmentId,
          $or: [{ lockedUntil: { $lte: now } }, { lockedUntil: { $exists: false } }],
        },
        { $set: { equipment: equipmentId, owner, lockedUntil } },
        { upsert: true, new: true }
      );

      if (lock.owner !== owner) {
        throw new Error('LOCK_BUSY');
      }

      try {
        return await work();
      } finally {
        await BookingLock.deleteOne({ equipment: equipmentId, owner }).catch(() => {});
      }
    } catch (err) {
      if (err?.code === 11000 || err?.message === 'LOCK_BUSY') {
        await new Promise((resolve) => setTimeout(resolve, 75 + attempt * 75));
        continue;
      }
      throw err;
    }
  }

  const err = new Error('Equipment is currently being booked by another request. Please try again in a moment.');
  err.status = 409;
  throw err;
}
