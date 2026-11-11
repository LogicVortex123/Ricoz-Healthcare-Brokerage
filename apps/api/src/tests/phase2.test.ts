import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { createApp } from '../app';
import { connectDb, disconnectDb } from '../config/db';
import { loadEnv } from '../config/env';
import { hashPassword } from '../utils/password';
import { User } from '../modules/users/user.model';
import { Practice } from '../modules/practices/practice.model';
import { Inquiry } from '../modules/inquiries/inquiry.model';
import { Assignment, Nda, RoomNote, Worksheet } from '../modules/deals/deal.models';

const csrf = { 'X-PracticeBridge-Request': '1' };

describe('deal room', () => {
  let mongod: MongoMemoryServer;
  let app: Express;
  let seller: request.Agent;
  let buyer: request.Agent;
  let stranger: request.Agent;
  let admin: request.Agent;
  let broker: request.Agent;
  let practiceId = '';
  let inquiryId = '';

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
    process.env.MONGODB_URI = mongod.getUri();
    process.env.WEB_ORIGIN = 'http://localhost:3000';
    await connectDb(mongod.getUri());
    await Promise.all([User.init(), Practice.init(), Inquiry.init(), Nda.init(), RoomNote.init(), Worksheet.init(), Assignment.init()]);
    app = createApp(loadEnv());
    const passwordHash = await hashPassword('Sellerpass123');
    await User.create({ name: 'Morgan Ellis', email: 'admin-deals@example.com', passwordHash: await hashPassword('Adminpass123'), role: 'ADMIN' });
    await User.create({ name: 'Riley Chen', email: 'broker-deals@example.com', passwordHash, role: 'BROKER' });
    seller = request.agent(app);
    buyer = request.agent(app);
    stranger = request.agent(app);
    admin = request.agent(app);
    broker = request.agent(app);
    await seller.post('/api/auth/register').set(csrf).send({ name: 'Elena Seller', email: 'elena.deals@example.com', password: 'Sellerpass123', role: 'SELLER' });
    await buyer.post('/api/auth/register').set(csrf).send({ name: 'James Buyer', email: 'james.deals@example.com', password: 'Buyerpass123', role: 'BUYER' });
    await stranger.post('/api/auth/register').set(csrf).send({ name: 'Ava Buyer', email: 'ava.deals@example.com', password: 'Buyerpass123', role: 'BUYER' });
    await admin.post('/api/auth/login').set(csrf).send({ email: 'admin-deals@example.com', password: 'Adminpass123' });
    await broker.post('/api/auth/login').set(csrf).send({ email: 'broker-deals@example.com', password: 'Sellerpass123' });
    const created = await seller.post('/api/practices').set(csrf).send({
      name: 'Harborlight Family Dental',
      category: 'DENTAL',
      specialty: 'General dentistry',
      city: 'Portland',
      state: 'Oregon',
      description: 'Fictional general dentistry practice with a stable hygiene schedule and room for a new owner to continue care.',
      yearsInOperation: 12,
      practitionerCount: 2,
      facilityInfo: 'Four operatories.',
      ownershipType: 'LLC',
      transactionType: 'COMPLETE_ACQUISITION',
      askingPrice: 850000,
      priceVisibility: 'PUBLIC',
      transitionReason: 'The owner is retiring and wants a planned handover.',
    });
    practiceId = created.body.data.practice.id;
    await seller.post(`/api/practices/${practiceId}/submit`).set(csrf).send({});
    await admin.post(`/api/admin/listings/${practiceId}/approve`).set(csrf).send({});
    const inquiry = await buyer.post('/api/inquiries').set(csrf).send({
      practiceId,
      message: 'I am a licensed dentist exploring a planned transition for this fictional practice.',
    });
    inquiryId = inquiry.body.data.inquiry.id;
  });

  afterAll(async () => {
    await disconnectDb();
    await mongod.stop();
  });

  it('keeps the document room closed until the buyer acknowledges confidentiality', async () => {
    const closed = await buyer.get(`/api/deals/practices/${practiceId}`);
    expect(closed.status).toBe(200);
    expect(closed.body.data.access).toBe('nda_required');
    expect(closed.body.data.notes).toBeUndefined();

    const opened = await buyer.post('/api/deals/ndas').set(csrf).send({ practiceId });
    expect(opened.status).toBe(201);
    expect(opened.body.data.access).toBe('open');

    const stillClosed = await stranger.get(`/api/deals/practices/${practiceId}`);
    expect(stillClosed.body.data.access).toBe('nda_required');
  });

  it('lets the owner add a note the acknowledging buyer can read', async () => {
    const note = await seller.post(`/api/deals/practices/${practiceId}/notes`).set(csrf).send({
      title: 'Lease summary',
      kind: 'LEASE',
      body: 'Fictional five-year suite lease. No patient information is included.',
    });
    expect(note.status).toBe(201);
    const room = await buyer.get(`/api/deals/practices/${practiceId}`);
    expect(room.body.data.notes[0].title).toBe('Lease summary');
  });

  it('calculates a worksheet only from the entered figures', async () => {
    const saved = await seller.put(`/api/deals/practices/${practiceId}/worksheet`).set(csrf).send({
      revenue: 1000000,
      operatingExpenses: 700000,
      ownerAddBack: 100000,
      multipleLow: 2,
      multipleHigh: 3,
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.earnings).toBe(400000);
    expect(saved.body.data.rangeLow).toBe(800000);
    expect(saved.body.data.rangeHigh).toBe(1200000);
    expect(saved.body.data.disclaimer).toMatch(/not an appraisal/i);
    expect(saved.body.data.disclaimer).toMatch(/does not report what other practices have sold for/i);
  });

  it('records an offer without transferring ownership and blocks an unassigned broker', async () => {
    const blocked = await broker.get(`/api/deals/practices/${practiceId}`);
    expect(blocked.status).toBe(200);
    expect(blocked.body.data.access).toBe('none');
    const write = await broker.post(`/api/deals/practices/${practiceId}/notes`).set(csrf).send({
      title: 'Not allowed',
      kind: 'OTHER',
      body: 'A broker who is not assigned cannot add a confidential note.',
    });
    expect(write.status).toBe(403);

    const offer = await buyer.post(`/api/deals/inquiries/${inquiryId}/offers`).set(csrf).send({
      amount: 800000,
      kind: 'OFFER',
      note: 'Proposal for discussion.',
    });
    expect(offer.status).toBe(201);
    const thread = await seller.get(`/api/deals/inquiries/${inquiryId}`);
    expect(thread.body.data.ownershipNotice).toMatch(/does not transfer ownership/i);
    expect(thread.body.data.offers[0].amount).toBe(800000);
  });

  it('assigns a broker and records a figure without charging a card', async () => {
    const brokers = await admin.get('/api/deals/brokers');
    const brokerId = brokers.body.data[0].id;
    const assigned = await admin.post(`/api/deals/practices/${practiceId}/assign`).set(csrf).send({ brokerId });
    expect(assigned.status).toBe(200);
    const room = await broker.get(`/api/deals/practices/${practiceId}`);
    expect(room.status).toBe(200);
    expect(room.body.data.access).toBe('open');

    const commission = await admin.post(`/api/deals/practices/${practiceId}/commission`).set(csrf).send({ amount: 25000, note: 'Agreed figure for the file.' });
    expect(commission.status).toBe(201);
    expect(commission.body.data.chargesCard).toBe(false);
    expect(commission.body.data.notice).toMatch(/No card is charged/);
  });
});
