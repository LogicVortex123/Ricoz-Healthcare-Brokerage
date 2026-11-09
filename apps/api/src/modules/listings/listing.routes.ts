import { Router } from 'express';
import { asyncHandler } from '../../utils/async';
import { HttpError } from '../../utils/errors';
import { formatZod } from '../../middleware/validate';
import { presentPractice } from '../practices/practice.presenter';
import { getApprovedPractice, searchApproved } from '../practices/practice.service';
import { listingQuerySchema, singleQuery } from '../practices/practice.schema';

export const listingRouter = Router();

listingRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = listingQuerySchema.safeParse(singleQuery(req.query as Record<string, unknown>));
    if (!parsed.success) {
      throw new HttpError(400, 'Those filters are not valid.', 'VALIDATION_ERROR', formatZod(parsed.error));
    }
    const result = await searchApproved(parsed.data);
    res.json({
      data: result.items.map((practice) => presentPractice(practice, 'public')),
      meta: result.meta,
    });
  }),
);

listingRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const practice = await getApprovedPractice(req.params.id);
    res.json({ data: { listing: presentPractice(practice, 'public') } });
  }),
);
