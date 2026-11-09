import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async';
import { validateBody } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { publicUser } from './user.presenter';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  phone: z.string().trim().max(30, 'Phone must be 30 characters or less.').optional().default(''),
  organization: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(80).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
});

export const userRouter = Router();

userRouter.patch(
  '/me',
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const body = req.body as z.infer<typeof profileSchema>;
    user.name = body.name;
    user.phone = body.phone;
    user.organization = body.organization;
    user.city = body.city;
    user.state = body.state;
    user.bio = body.bio;
    await user.save();
    res.json({ data: { user: publicUser(user) } });
  }),
);
