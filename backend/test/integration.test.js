import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';

import { app } from '../src/server.js';
import { connectDB } from '../src/config/db.js';
import { withEquipmentLock } from '../src/utils/bookingLock.js';

let adminToken = '';
let researcherToken = '';

before(async () => {
  await connectDB();

  // Obtain admin token
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@researchflow.com', password: 'ResearchFlow@123' });

  assert.equal(adminRes.status, 200);
  adminToken = adminRes.body.token;

  // Obtain researcher token
  const researcherRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'researcher@researchflow.com', password: 'ResearchFlow@123' });

  assert.equal(researcherRes.status, 200);
  researcherToken = researcherRes.body.token;
});

after(async () => {
  await mongoose.disconnect();
});

test('1. Health check returns 200 OK', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.service, 'researchflow-api');
});

test('2. Authentication rejects invalid credentials with 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@researchflow.com', password: 'WrongPassword' });

  assert.equal(res.status, 401);
  assert.match(res.body.message, /invalid/i);
});

test('3. Protected routes reject unauthenticated requests with 401', async () => {
  const res = await request(app).get('/api/experiments');
  assert.equal(res.status, 401);
});

test('4. RBAC rejects researcher creating equipment with 403 Forbidden', async () => {
  const res = await request(app)
    .post('/api/equipment')
    .set('Authorization', `Bearer ${researcherToken}`)
    .send({ name: 'Unauthorized Detector', model: 'UD-1' });

  assert.equal(res.status, 403);
  assert.match(res.body.message, /permission/i);
});

test('5. RBAC allows institution_admin to access audit logs', async () => {
  const res = await request(app)
    .get('/api/audit')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.logs));
  assert.ok(res.body.pagination);
});

test('6. Reservation creation rejects past dates with 400 Bad Request', async () => {
  const res = await request(app)
    .post('/api/reservations')
    .set('Authorization', `Bearer ${researcherToken}`)
    .send({
      equipment: new mongoose.Types.ObjectId(),
      startTime: '2020-01-01T10:00:00Z',
      endTime: '2020-01-01T12:00:00Z',
    });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /past/i);
});

test('7. Distributed booking lock acquires and releases lease cleanly', async () => {
  const mockEquipmentId = new mongoose.Types.ObjectId();
  let executed = false;

  await withEquipmentLock(mockEquipmentId, async () => {
    executed = true;
    return 'locked_work_done';
  });

  assert.equal(executed, true);

  // Subsequent lock attempt on same equipment should succeed immediately
  let secondExecution = false;
  await withEquipmentLock(mockEquipmentId, async () => {
    secondExecution = true;
  });

  assert.equal(secondExecution, true);
});
