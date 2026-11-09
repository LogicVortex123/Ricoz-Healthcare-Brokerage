import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { HttpError } from '../../utils/errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { INQUIRY_STATUSES } from './inquiry.model';
import { createInquiry, getInquiryForUser, listInquiries, presentInquiry, updateInquiryStatus } from './inquiry.service';

const createSchema = z.object({
  practiceId: z.string().regex(/^[a-f\d]{24}$/i, 'Choose a valid practice.'),
  message: z
    .string()
    .trim()
    .min(20, 'Write at least 20 characters so the seller understands your interest.')
    .max(2000),
});

const statusSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'CLOSED']),
});

export const inquiryRouter = Router();
inquiryRouter.use(requireAuth);

inquiryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const practiceId = typeof req.query.practiceId === 'string' ? req.query.practiceId : undefined;
    if (practiceId && !/^[a-f\d]{24}$/i.test(practiceId)) {
      throw new HttpError(400, 'That practice filter is not valid.', 'VALIDATION_ERROR');
    }
    const user = req.user!;
    const inquiries = await listInquiries({ id: String(user._id), role: user.role }, practiceId);
    const audience = user.role === 'ADMIN' ? 'admin' : user.role === 'SELLER' ? 'seller' : 'buyer';
    res.json({ data: inquiries.map((inquiry) => presentInquiry(inquiry, audience)) });
  }),
);

inquiryRouter.post(
  '/',
  requireRole('BUYER'),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const inquiry = await createInquiry(String(req.user!._id), body.practiceId, body.message);
    res.status(201).json({ data: { inquiry: presentInquiry(inquiry, 'buyer') } });
  }),
);

inquiryRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const result = await getInquiryForUser({ id: String(user._id), role: user.role }, req.params.id);
    res.json({ data: { inquiry: presentInquiry(result.inquiry, result.audience) } });
  }),
);

inquiryRouter.patch(
  '/:id',
  requireRole('SELLER'),
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof statusSchema>;
    if (!INQUIRY_STATUSES.includes(body.status)) {
      throw new HttpError(400, 'That status is not valid.', 'VALIDATION_ERROR');
    }
    const inquiry = await updateInquiryStatus(String(req.user!._id), req.params.id, body.status);
    res.json({ data: { inquiry: presentInquiry(inquiry, 'seller') } });
  }),
);
