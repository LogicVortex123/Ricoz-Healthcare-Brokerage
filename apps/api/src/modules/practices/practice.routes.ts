import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { HttpError } from '../../utils/errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { LISTING_STATUSES } from './practice.model';
import { parsePracticeDraft } from './practice.schema';
import { presentPractice } from './practice.presenter';
import {
  createPractice,
  getOwnedPractice,
  listOwnedPractices,
  submitPractice,
  updatePractice,
  withdrawPractice,
} from './practice.service';

export const practiceRouter = Router();
practiceRouter.use(requireAuth, requireRole('SELLER'));

practiceRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const statusResult = z.enum(LISTING_STATUSES).optional().safeParse(
      typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined,
    );
    if (!statusResult.success) {
      throw new HttpError(400, 'That status filter is not valid.', 'VALIDATION_ERROR');
    }
    const practices = await listOwnedPractices(String(req.user!._id), statusResult.data);
    res.json({ data: practices.map((practice) => presentPractice(practice, 'owner')) });
  }),
);

practiceRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parsePracticeDraft(req.body);
    const practice = await createPractice(String(req.user!._id), input);
    res.status(201).json({ data: { practice: presentPractice(practice, 'owner') } });
  }),
);

practiceRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const practice = await getOwnedPractice(String(req.user!._id), req.params.id);
    res.json({ data: { practice: presentPractice(practice, 'owner') } });
  }),
);

practiceRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = parsePracticeDraft(req.body);
    const practice = await updatePractice(String(req.user!._id), req.params.id, input);
    res.json({ data: { practice: presentPractice(practice, 'owner') } });
  }),
);

practiceRouter.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const practice = await submitPractice(String(req.user!._id), req.params.id);
    res.json({ data: { practice: presentPractice(practice, 'owner') } });
  }),
);

practiceRouter.post(
  '/:id/withdraw',
  asyncHandler(async (req, res) => {
    const practice = await withdrawPractice(String(req.user!._id), req.params.id);
    res.json({ data: { practice: presentPractice(practice, 'owner') } });
  }),
);
