import bcrypt from 'bcryptjs';
import {connectDB} from '../config/db.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const email='admin@researchflow.com';
const password='ResearchFlow@123';
try {
  await connectDB();
  const user=await User.findOne({email});
  if(!user) throw new Error(`Demo account missing: ${email}`);
  if(!user.active) throw new Error(`Demo account inactive: ${email}`);
  if(!await bcrypt.compare(password,user.password)) throw new Error(`Demo password does not match for ${email}`);
  console.log(`[VERIFY] Demo login credentials are valid for ${email} (${user.role}).`);
  await mongoose.disconnect();
} catch (e) {
  console.error(`[VERIFY] Demo login verification failed: ${e.message}`);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
}
