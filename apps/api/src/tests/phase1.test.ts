import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { createApp } from '../app';
import { connectDb, disconnectDb } from '../config/db';
import { loadEnv } from '../config/env';
import { User } from '../modules/users/user.model';
import { Practice } from '../modules/practices/practice.model';
import { Inquiry } from '../modules/inquiries/inquiry.model';
import { AuditEvent } from '../modules/audit/audit.model';
import { hashPassword } from '../utils/password';

const csrf = { 'X-PracticeBridge-Request': '1' };
const sellerPassword = 'Sellerpass123';
const buyerPassword = 'Buyerpass123';
const adminPassword = 'Adminpass123';

function practiceBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Northwind Family Dental',
    category: 'DENTAL',
    specialty: 'General dentistry',
    city: 'Portland',
    state: 'Oregon',
    description: 'Fictional general dentistry practice with a stable hygiene schedule and room for a new owner to continue care.',
    yearsInOperation: 18,
    practitionerCount: 3,
    facilityInfo: 'Four operatories, digital sensors, and a ground-floor clinical suite.',
    ownershipType: 'LLC',
    transactionType: 'COMPLETE_ACQUISITION',
    ownershipPercentage: null,
    askingPrice: 850000,
    priceVisibility: 'PUBLIC',
    transitionReason: 'The owner is retiring and wants a planned handover to a licensed dentist.',
    ...overrides,
  };
}

describe('phase 1 API', () => {
  let mongod: MongoMemoryServer;
  let app: Express;
  let seller: request.Agent;
  let buyer: request.Agent;
  let otherBuyer: request.Agent;
  let admin: request.Agent;
  let otherSeller: request.Agent;
  let practiceId = '';
  let hiddenPriceId = '';
  let veterinaryId = '';
  let inquiryId = '';
  const sellerEmail = 'elena.seller@example.com';
  const buyerEmail = 'james.buyer@example.com';

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
    process.env.MONGODB_URI = mongod.getUri();
    process.env.WEB_ORIGIN = 'http://localhost:3000';
    await connectDb(mongod.getUri());
    await Promise.all([User.init(), Practice.init(), Inquiry.init(), AuditEvent.init()]);
    app = createApp(loadEnv());
    await User.create({
      name: 'Morgan Ellis',
      email: 'admin@example.com',
      passwordHash: await hashPassword(adminPassword),
      role: 'ADMIN',
    });
    seller = request.agent(app);
    buyer = request.agent(app);
    otherBuyer = request.agent(app);
    otherSeller = request.agent(app);
    admin = request.agent(app);
  });

  afterAll(async () => {
    await disconnectDb();
    await mongod.stop();
  });

  it('reports a connected database without exposing credentials', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.data.database).toBe('connected');
    expect(JSON.stringify(response.body)).not.toMatch(/mongodb/i);
  });

  it('rejects a state-changing request without the CSRF header', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: sellerEmail, password: sellerPassword });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
  });

  it('registers a seller and stores a password hash', async () => {
    const response = await seller.post('/api/auth/register').set(csrf).send({
      name: 'Elena Vasquez',
      email: sellerEmail,
      password: sellerPassword,
      role: 'SELLER',
    });
    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(sellerEmail);
    expect(response.body.data.user.role).toBe('SELLER');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.token).toBeUndefined();
    expect(String(response.headers['set-cookie'])).toMatch(/HttpOnly/i);
    const stored = await User.findOne({ email: sellerEmail }).select('+passwordHash');
    expect(stored?.passwordHash).toBeTruthy();
    expect(stored?.passwordHash).not.toBe(sellerPassword);
  });

  it('rejects a duplicate email and privileged self-registration', async () => {
    const duplicate = await request(app).post('/api/auth/register').set(csrf).send({
      name: 'Elena Vasquez',
      email: 'Elena.Seller@example.com',
      password: sellerPassword,
      role: 'BUYER',
    });
    expect(duplicate.status).toBe(409);

    const privileged = await request(app).post('/api/auth/register').set(csrf).send({
      name: 'Pat Admin',
      email: 'pat.admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    });
    expect(privileged.status).toBe(400);
    expect(await User.countDocuments({ email: 'pat.admin@example.com' })).toBe(0);
  });

  it('rejects an invalid password and a bad login', async () => {
    const weak = await request(app).post('/api/auth/register').set(csrf).send({
      name: 'Weak User',
      email: 'weak@example.com',
      password: 'short',
      role: 'BUYER',
    });
    expect(weak.status).toBe(400);

    const invalid = await seller.post('/api/auth/login').set(csrf).send({ email: sellerEmail, password: 'Sellerpass999' });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.message).toBe('Email or password is incorrect.');
  });

  it('logs in, returns the current user, and logs out', async () => {
    const login = await seller.post('/api/auth/login').set(csrf).send({ email: sellerEmail, password: sellerPassword });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeUndefined();
    const me = await seller.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(sellerEmail);
    const logout = await seller.post('/api/auth/logout').set(csrf).send({});
    expect(logout.status).toBe(200);
    const after = await seller.get('/api/auth/me');
    expect(after.status).toBe(401);
  });

  it('rejects an expired session', async () => {
    const stored = await User.findOne({ email: sellerEmail });
    const token = jwt.sign(
      { sub: String(stored?._id), role: 'SELLER', exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET as string,
      { issuer: 'practicebridge' },
    );
    const response = await request(app).get('/api/auth/me').set('Cookie', `pb_session=${token}`);
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('creates, edits, and guards a seller draft', async () => {
    await seller.post('/api/auth/login').set(csrf).send({ email: sellerEmail, password: sellerPassword });
    const created = await seller.post('/api/practices').set(csrf).send({ name: 'Northwind Family Dental', category: 'DENTAL' });
    expect(created.status).toBe(201);
    practiceId = created.body.data.practice.id;
    expect(created.body.data.practice.status).toBe('DRAFT');

    const invalid = await seller.patch(`/api/practices/${practiceId}`).set(csrf).send({ name: 'N', category: 'DENTAL', yearsInOperation: -5 });
    expect(invalid.status).toBe(400);

    const updated = await seller.patch(`/api/practices/${practiceId}`).set(csrf).send(practiceBody());
    expect(updated.status).toBe(200);
    expect(updated.body.data.practice.city).toBe('Portland');

    await otherSeller.post('/api/auth/register').set(csrf).send({
      name: 'Other Seller',
      email: 'other.seller@example.com',
      password: sellerPassword,
      role: 'SELLER',
    });
    const forbidden = await otherSeller.patch(`/api/practices/${practiceId}`).set(csrf).send(practiceBody({ name: 'Taken Over' }));
    expect(forbidden.status).toBe(403);
    const unchanged = await Practice.findById(practiceId);
    expect(unchanged?.name).toBe('Northwind Family Dental');
  });

  it('requires a complete listing before review and hides it from buyers', async () => {
    const incomplete = await seller.post('/api/practices').set(csrf).send({ name: 'Incomplete Clinic', category: 'VETERINARY' });
    const blocked = await seller.post(`/api/practices/${incomplete.body.data.practice.id}/submit`).set(csrf).send({});
    expect(blocked.status).toBe(400);

    const submitted = await seller.post(`/api/practices/${practiceId}/submit`).set(csrf).send({});
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.practice.status).toBe('PENDING_REVIEW');

    const hidden = await request(app).get('/api/listings');
    expect(hidden.body.data.find((item: { id: string }) => item.id === practiceId)).toBeUndefined();
    const detail = await request(app).get(`/api/listings/${practiceId}`);
    expect(detail.status).toBe(404);

    const locked = await seller.patch(`/api/practices/${practiceId}`).set(csrf).send(practiceBody({ name: 'Changed While Pending' }));
    expect(locked.status).toBe(409);
  });

  it('lets only an admin approve a listing', async () => {
    await buyer.post('/api/auth/register').set(csrf).send({
      name: 'James Okonkwo',
      email: buyerEmail,
      password: buyerPassword,
      role: 'BUYER',
    });
    const buyerAttempt = await buyer.post(`/api/admin/listings/${practiceId}/approve`).set(csrf).send({});
    expect(buyerAttempt.status).toBe(403);
    const stranger = await request(app).post(`/api/admin/listings/${practiceId}/approve`).set(csrf).send({});
    expect(stranger.status).toBe(401);

    await admin.post('/api/auth/login').set(csrf).send({ email: 'admin@example.com', password: adminPassword });
    const approved = await admin.post(`/api/admin/listings/${practiceId}/approve`).set(csrf).send({});
    expect(approved.status).toBe(200);
    expect(approved.body.data.listing.status).toBe('APPROVED');
    expect(approved.body.data.listing.owner.email).toBe(sellerEmail);
  });

  it('shows only approved listings and filters them', async () => {
    const veterinary = await seller.post('/api/practices').set(csrf).send(
      practiceBody({
        name: 'Cedar and Pine Veterinary',
        category: 'VETERINARY',
        specialty: 'Small animal',
        city: 'Burlington',
        state: 'Vermont',
        askingPrice: 1200000,
      }),
    );
    veterinaryId = veterinary.body.data.practice.id;
    await seller.post(`/api/practices/${veterinaryId}/submit`).set(csrf).send({});
    await admin.post(`/api/admin/listings/${veterinaryId}/approve`).set(csrf).send({});

    const hidden = await seller.post('/api/practices').set(csrf).send(
      practiceBody({
        name: 'Lakeshore Orthopedics',
        category: 'SPECIALIST_MEDICAL',
        specialty: 'Orthopedics',
        city: 'Madison',
        state: 'Wisconsin',
        askingPrice: 2400000,
        priceVisibility: 'ON_REQUEST',
      }),
    );
    hiddenPriceId = hidden.body.data.practice.id;
    await seller.post(`/api/practices/${hiddenPriceId}/submit`).set(csrf).send({});
    await admin.post(`/api/admin/listings/${hiddenPriceId}/approve`).set(csrf).send({});

    const all = await request(app).get('/api/listings');
    expect(all.status).toBe(200);
    const ids = all.body.data.map((item: { id: string }) => item.id);
    expect(ids).toContain(practiceId);
    expect(ids).toContain(veterinaryId);
    expect(JSON.stringify(all.body)).not.toContain(sellerEmail);
    const confidential = all.body.data.find((item: { id: string }) => item.id === hiddenPriceId);
    expect(confidential.askingPrice).toBeNull();
    expect(confidential.priceVisibility).toBe('ON_REQUEST');

    const dental = await request(app).get('/api/listings?category=DENTAL');
    expect(dental.body.data.every((item: { category: string }) => item.category === 'DENTAL')).toBe(true);
    const vermont = await request(app).get('/api/listings?state=vermont');
    expect(vermont.body.data).toHaveLength(1);
    expect(vermont.body.data[0].city).toBe('Burlington');
    const priced = await request(app).get('/api/listings?minPrice=1000000');
    expect(priced.body.data.map((item: { id: string }) => item.id)).toContain(veterinaryId);
    expect(priced.body.data.map((item: { id: string }) => item.id)).not.toContain(practiceId);

    const page = await request(app).get('/api/listings?limit=1&page=1&sort=name');
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta.total).toBeGreaterThanOrEqual(3);
    expect(page.body.meta.totalPages).toBeGreaterThanOrEqual(3);
    const pageTwo = await request(app).get('/api/listings?limit=1&page=2&sort=name');
    expect(pageTwo.body.data[0].id).not.toBe(page.body.data[0].id);
  });

  it('creates an inquiry and keeps it private to the participants', async () => {
    const created = await buyer.post('/api/inquiries').set(csrf).send({
      practiceId,
      message: 'I am a licensed dentist exploring a complete acquisition in Oregon and would like to start a conversation.',
    });
    expect(created.status).toBe(201);
    inquiryId = created.body.data.inquiry.id;
    expect(JSON.stringify(created.body)).not.toContain(sellerEmail);

    const duplicate = await buyer.post('/api/inquiries').set(csrf).send({
      practiceId,
      message: 'This second note should not create another active inquiry for the same practice.',
    });
    expect(duplicate.status).toBe(409);

    await otherBuyer.post('/api/auth/register').set(csrf).send({
      name: 'Amina Diallo',
      email: 'amina.buyer@example.com',
      password: buyerPassword,
      role: 'BUYER',
    });
    const forbidden = await otherBuyer.get(`/api/inquiries/${inquiryId}`);
    expect(forbidden.status).toBe(403);

    const sellerView = await seller.get('/api/inquiries');
    expect(sellerView.status).toBe(200);
    expect(sellerView.body.data[0].buyer.email).toBe(buyerEmail);
    expect(sellerView.body.data[0].practice.name).toBe('Northwind Family Dental');

    const buyerView = await buyer.get('/api/inquiries');
    expect(buyerView.body.data[0].id).toBe(inquiryId);
    expect(buyerView.body.data[0].buyer).toBeUndefined();
    expect(JSON.stringify(buyerView.body)).not.toContain(sellerEmail);

    const unapproved = await buyer.post('/api/inquiries').set(csrf).send({
      practiceId: (await seller.post('/api/practices').set(csrf).send({ name: 'Still Private', category: 'DENTAL' })).body.data.practice.id,
      message: 'This inquiry targets a draft and must not be accepted by the server.',
    });
    expect(unapproved.status).toBe(404);
  });

  it('rejects a listing with a reason and allows a corrected resubmission', async () => {
    const created = await seller.post('/api/practices').set(csrf).send(
      practiceBody({ name: 'Harbor Specialty Dental', city: 'Salem', askingPrice: 640000 }),
    );
    const id = created.body.data.practice.id;
    await seller.post(`/api/practices/${id}/submit`).set(csrf).send({});
    const short = await admin.post(`/api/admin/listings/${id}/reject`).set(csrf).send({ reason: 'Too short' });
    expect(short.status).toBe(400);
    const rejected = await admin.post(`/api/admin/listings/${id}/reject`).set(csrf).send({
      reason: 'Please clarify whether the facility lease transfers with the practice.',
    });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.listing.status).toBe('REJECTED');

    const sellerView = await seller.get(`/api/practices/${id}`);
    expect(sellerView.body.data.practice.rejectionReason).toMatch(/facility lease/);
    const hidden = await request(app).get(`/api/listings/${id}`);
    expect(hidden.status).toBe(404);

    const corrected = await seller.patch(`/api/practices/${id}`).set(csrf).send(
      practiceBody({
        name: 'Harbor Specialty Dental',
        city: 'Salem',
        askingPrice: 640000,
        facilityInfo: 'Four operatories. The facility lease can transfer to the buyer with landlord consent.',
      }),
    );
    expect(corrected.status).toBe(200);
    const resubmitted = await seller.post(`/api/practices/${id}/submit`).set(csrf).send({});
    expect(resubmitted.body.data.practice.status).toBe('PENDING_REVIEW');
    expect(resubmitted.body.data.practice.rejectionReason).toBe('');
    const approved = await admin.post(`/api/admin/listings/${id}/approve`).set(csrf).send({});
    expect(approved.body.data.listing.status).toBe('APPROVED');
  });

  it('returns dashboard counts from the database', async () => {
    const sellerDash = await seller.get('/api/dashboard');
    expect(sellerDash.body.data.role).toBe('SELLER');
    expect(sellerDash.body.data.totalPractices).toBeGreaterThanOrEqual(4);
    expect(sellerDash.body.data.approved).toBeGreaterThanOrEqual(3);
    expect(sellerDash.body.data.inquiries).toBeGreaterThanOrEqual(1);

    const buyerDash = await buyer.get('/api/dashboard');
    expect(buyerDash.body.data.availableListings).toBe(sellerDash.body.data.approved);
    expect(buyerDash.body.data.inquiries).toBeGreaterThanOrEqual(1);

    const adminDash = await admin.get('/api/dashboard');
    expect(adminDash.body.data.users).toBeGreaterThanOrEqual(4);
    expect(adminDash.body.data.pending).toBe(0);
    expect(adminDash.body.data.inquiries).toBeGreaterThanOrEqual(1);
  });

  it('blocks anonymous access to a protected route', async () => {
    const response = await request(app).get('/api/dashboard');
    expect(response.status).toBe(401);
  });
});
