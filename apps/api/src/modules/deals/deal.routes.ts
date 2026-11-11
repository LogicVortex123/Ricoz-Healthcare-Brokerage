import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  acceptNda,
  addMessage,
  addNote,
  addOffer,
  addTask,
  assignBroker,
  brokerDesk,
  inquiryThread,
  listBrokers,
  listSaved,
  practiceBundle,
  recordCommission,
  saveWorksheet,
  setSaved,
  toggleTask,
} from './deal.service';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid record.');

const noteSchema = z.object({
  title: z.string().trim().min(2).max(120),
  kind: z.enum(['FINANCIAL', 'LEASE', 'STAFFING', 'OTHER']),
  body: z.string().trim().min(10, 'Write the confidential note.').max(8000),
});

const worksheetSchema = z.object({
  revenue: z.number().min(0).max(1_000_000_000),
  operatingExpenses: z.number().min(0).max(1_000_000_000),
  ownerAddBack: z.number().min(0).max(1_000_000_000),
  multipleLow: z.number().min(0.5).max(8),
  multipleHigh: z.number().min(0.5).max(8),
});

const taskSchema = z.object({ label: z.string().trim().min(2).max(160) });
const doneSchema = z.object({ done: z.boolean() });
const assignSchema = z.object({ brokerId: id });
const commissionSchema = z.object({
  amount: z.number().min(0).max(100_000_000),
  note: z.string().trim().max(500).default(''),
});
const messageSchema = z.object({ body: z.string().trim().min(1).max(2000) });
const offerSchema = z.object({
  amount: z.number().min(1).max(1_000_000_000),
  kind: z.enum(['OFFER', 'COUNTER', 'ACCEPTED', 'DECLINED']),
  note: z.string().trim().max(1000).default(''),
});
const ndaSchema = z.object({ practiceId: id });

export const dealRouter = Router();
dealRouter.use(requireAuth);

dealRouter.get('/saved', requireRole('BUYER'), asyncHandler(async (req, res) => {
  res.json({ data: await listSaved(req.user!) });
}));

dealRouter.get('/brokers', requireRole('ADMIN'), asyncHandler(async (_req, res) => {
  res.json({ data: await listBrokers() });
}));

dealRouter.get('/broker', requireRole('BROKER'), asyncHandler(async (req, res) => {
  res.json({ data: await brokerDesk(req.user!) });
}));

dealRouter.post('/ndas', requireRole('BUYER'), validateBody(ndaSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof ndaSchema>;
  res.status(201).json({ data: await acceptNda(req.user!, body.practiceId) });
}));

dealRouter.get('/practices/:id', asyncHandler(async (req, res) => {
  res.json({ data: await practiceBundle(req.user!, req.params.id) });
}));

dealRouter.post('/practices/:id/notes', validateBody(noteSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof noteSchema>;
  res.status(201).json({ data: await addNote(req.user!, req.params.id, body) });
}));

dealRouter.put('/practices/:id/worksheet', validateBody(worksheetSchema), asyncHandler(async (req, res) => {
  res.json({ data: await saveWorksheet(req.user!, req.params.id, req.body as z.infer<typeof worksheetSchema>) });
}));

dealRouter.post('/practices/:id/tasks', validateBody(taskSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof taskSchema>;
  res.status(201).json({ data: await addTask(req.user!, req.params.id, body.label) });
}));

dealRouter.post('/practices/:id/save', requireRole('BUYER'), asyncHandler(async (req, res) => {
  res.json({ data: await setSaved(req.user!, req.params.id, true) });
}));

dealRouter.delete('/practices/:id/save', requireRole('BUYER'), asyncHandler(async (req, res) => {
  res.json({ data: await setSaved(req.user!, req.params.id, false) });
}));

dealRouter.post('/practices/:id/assign', requireRole('ADMIN'), validateBody(assignSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof assignSchema>;
  res.json({ data: await assignBroker(req.user!, req.params.id, body.brokerId) });
}));

dealRouter.post('/practices/:id/commission', requireRole('ADMIN'), validateBody(commissionSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof commissionSchema>;
  res.status(201).json({ data: await recordCommission(req.user!, req.params.id, body.amount, body.note) });
}));

dealRouter.patch('/tasks/:id', validateBody(doneSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof doneSchema>;
  res.json({ data: await toggleTask(req.user!, req.params.id, body.done) });
}));

dealRouter.get('/inquiries/:id', asyncHandler(async (req, res) => {
  res.json({ data: await inquiryThread(req.user!, req.params.id) });
}));

dealRouter.post('/inquiries/:id/messages', validateBody(messageSchema), asyncHandler(async (req, res) => {
  const body = req.body as z.infer<typeof messageSchema>;
  res.status(201).json({ data: await addMessage(req.user!, req.params.id, body.body) });
}));

dealRouter.post('/inquiries/:id/offers', validateBody(offerSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ data: await addOffer(req.user!, req.params.id, req.body as z.infer<typeof offerSchema>) });
}));
