import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { HttpError } from '../../utils/errors';
import { formatZod } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { User } from '../users/user.model';
import { publicUser } from '../users/user.presenter';
import { LISTING_STATUSES } from '../practices/practice.model';
import { presentPractice } from '../practices/practice.presenter';
import { approvePractice, getForAdmin, listForAdmin, rejectPractice } from '../practices/practice.service';
import { rejectionSchema } from '../practices/practice.schema';
import { escapeRegex } from '../../utils/regex';
import { listInquiries, presentInquiry } from '../inquiries/inquiry.service';

const listSchema = z.object({
  status: z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : value),
    z.enum(LISTING_STATUSES).optional(),
  ),
  q: z.string().trim().max(120).optional(),
  page: z.preprocess((value) => (value === undefined || value === '' ? 1 : value), z.coerce.number().int().min(1).max(10000)),
  limit: z.preprocess((value) => (value === undefined || value === '' ? 20 : value), z.coerce.number().int().min(1).max(50)),
});

function queryStrings(query: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get(
  '/listings',
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(queryStrings(req.query as Record<string, unknown>));
    if (!parsed.success) throw new HttpError(400, 'Those filters are not valid.', 'VALIDATION_ERROR', formatZod(parsed.error));
    const result = await listForAdmin(parsed.data.status, parsed.data.page, parsed.data.limit);
    res.json({
      data: result.items.map((practice) => presentPractice(practice, 'admin')),
      meta: result.meta,
    });
  }),
);

adminRouter.get(
  '/listings/:id',
  asyncHandler(async (req, res) => {
    const practice = await getForAdmin(req.params.id);
    res.json({ data: { listing: presentPractice(practice, 'admin') } });
  }),
);

adminRouter.post(
  '/listings/:id/approve',
  asyncHandler(async (req, res) => {
    const practice = await approvePractice(String(req.user!._id), req.params.id);
    const populated = await getForAdmin(String(practice._id));
    res.json({ data: { listing: presentPractice(populated, 'admin') } });
  }),
);

adminRouter.post(
  '/listings/:id/reject',
  validateBody(rejectionSchema),
  asyncHandler(async (req, res) => {
    const practice = await rejectPractice(String(req.user!._id), req.params.id, req.body.reason as string);
    const populated = await getForAdmin(String(practice._id));
    res.json({ data: { listing: presentPractice(populated, 'admin') } });
  }),
);

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const parsed = listSchema.safeParse(queryStrings(req.query as Record<string, unknown>));
    if (!parsed.success) throw new HttpError(400, 'Those filters are not valid.', 'VALIDATION_ERROR', formatZod(parsed.error));
    const filter = parsed.data.q
      ? { $or: [{ name: new RegExp(escapeRegex(parsed.data.q), 'i') }, { email: new RegExp(escapeRegex(parsed.data.q), 'i') }] }
      : {};
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('name email role phone organization city state bio createdAt')
        .sort({ createdAt: -1 })
        .skip((parsed.data.page - 1) * parsed.data.limit)
        .limit(parsed.data.limit),
    ]);
    res.json({
      data: users.map((user) => publicUser(user)),
      meta: {
        page: parsed.data.page,
        limit: parsed.data.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / parsed.data.limit),
      },
    });
  }),
);

adminRouter.get(
  '/inquiries',
  asyncHandler(async (req, res) => {
    const inquiries = await listInquiries({ id: String(req.user!._id), role: 'ADMIN' });
    res.json({ data: inquiries.map((inquiry) => presentInquiry(inquiry, 'admin')) });
  }),
);
