import { Router } from 'express';
import { asyncHandler } from '../../utils/async';
import { requireAuth } from '../../middleware/auth';
import { Practice } from '../practices/practice.model';
import { presentPractice } from '../practices/practice.presenter';
import { Inquiry } from '../inquiries/inquiry.model';
import { presentInquiry } from '../inquiries/inquiry.service';
import { User } from '../users/user.model';
import { SavedPractice } from '../deals/deal.models';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const userId = user._id;

    if (user.role === 'SELLER') {
      const [totalPractices, drafts, pending, approved, rejected, withdrawn, inquiries, recent] = await Promise.all([
        Practice.countDocuments({ ownerId: userId }),
        Practice.countDocuments({ ownerId: userId, status: 'DRAFT' }),
        Practice.countDocuments({ ownerId: userId, status: 'PENDING_REVIEW' }),
        Practice.countDocuments({ ownerId: userId, status: 'APPROVED' }),
        Practice.countDocuments({ ownerId: userId, status: 'REJECTED' }),
        Practice.countDocuments({ ownerId: userId, status: 'WITHDRAWN' }),
        Inquiry.countDocuments({ sellerId: userId }),
        Practice.find({ ownerId: userId }).sort({ updatedAt: -1 }).limit(5),
      ]);
      res.json({
        data: {
          role: 'SELLER',
          totalPractices,
          drafts,
          pending,
          approved,
          rejected,
          withdrawn,
          inquiries,
          recentPractices: recent.map((practice) => presentPractice(practice, 'owner')),
        },
      });
      return;
    }

    if (user.role === 'BUYER') {
      const [availableListings, inquiries, openInquiries, acknowledgedInquiries, closedInquiries, savedPractices, recent] = await Promise.all([
        Practice.countDocuments({ status: 'APPROVED' }),
        Inquiry.countDocuments({ buyerId: userId }),
        Inquiry.countDocuments({ buyerId: userId, status: 'OPEN' }),
        Inquiry.countDocuments({ buyerId: userId, status: 'ACKNOWLEDGED' }),
        Inquiry.countDocuments({ buyerId: userId, status: 'CLOSED' }),
        SavedPractice.countDocuments({ buyerId: userId }),
        Inquiry.find({ buyerId: userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('practiceId', 'name category city state')
          .populate('buyerId', 'name email organization city state phone')
          .populate('sellerId', 'name email'),
      ]);
      res.json({
        data: {
          role: 'BUYER',
          availableListings,
          inquiries,
          openInquiries,
          acknowledgedInquiries,
          closedInquiries,
          savedPractices,
          recentInquiries: recent.map((inquiry) => presentInquiry(inquiry, 'buyer')),
        },
      });
      return;
    }

    if (user.role === 'ADMIN') {
      const [users, listings, pending, approved, inquiries, recent] = await Promise.all([
        User.countDocuments(),
        Practice.countDocuments(),
        Practice.countDocuments({ status: 'PENDING_REVIEW' }),
        Practice.countDocuments({ status: 'APPROVED' }),
        Inquiry.countDocuments(),
        Practice.find({ status: 'PENDING_REVIEW' }).sort({ submittedAt: -1 }).limit(5).populate('ownerId', 'name email'),
      ]);
      res.json({
        data: {
          role: 'ADMIN',
          users,
          listings,
          pending,
          approved,
          inquiries,
          recentPending: recent.map((practice) => presentPractice(practice, 'admin')),
        },
      });
      return;
    }

    const availableListings = await Practice.countDocuments({ status: 'APPROVED' });
    res.json({ data: { role: 'BROKER', availableListings } });
  }),
);
