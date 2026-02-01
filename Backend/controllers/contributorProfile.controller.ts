require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ContributorProfileModel, { IContributorProfile } from '../models/contributorProfile.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** GET /contributor-profile – get own contributor profile (create empty if not exists) */
export const getOwnContributorProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler('Unauthorized', 401));

  const user = await UserModel.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'contributor') return next(new ErrorHandler('Only contributor users have a contributor profile', 403));

  let profile = await ContributorProfileModel.findOne({ userId }).lean();
  if (!profile) {
    const newProfile = await ContributorProfileModel.create({
      userId,
      skills: [],
      portfolio: '',
      paymentInfo: '',
      earningsSummary: 0,
      availability: '',
    });
    profile = newProfile.toObject();
  }
  res.status(200).json({ success: true, profile });
});

/** PUT /contributor-profile – create or update own contributor profile */
export const putContributorProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler('Unauthorized', 401));

  const user = await UserModel.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'contributor') return next(new ErrorHandler('Only contributor users can update contributor profile', 403));

  const { skills, portfolio, paymentInfo, earningsSummary, availability } = req.body as Partial<IContributorProfile>;
  const update: Record<string, unknown> = {};
  if (Array.isArray(skills)) update.skills = skills.filter((s: unknown) => typeof s === 'string');
  if (portfolio != null && typeof portfolio === 'string') update.portfolio = portfolio.trim();
  if (paymentInfo != null && typeof paymentInfo === 'string') update.paymentInfo = paymentInfo.trim();
  if (typeof earningsSummary === 'number' && !isNaN(earningsSummary)) update.earningsSummary = earningsSummary;
  if (availability != null && typeof availability === 'string') update.availability = availability.trim();

  let profile = await ContributorProfileModel.findOne({ userId });
  if (!profile) {
    profile = await ContributorProfileModel.create({
      userId,
      ...update,
    });
  } else {
    Object.assign(profile, update);
    await profile.save();
  }
  res.status(200).json({ success: true, profile });
});

/** GET /contributor-profile/list – list contributor profiles (public-safe fields for showcase) */
export const listContributorProfiles = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const profiles = await ContributorProfileModel.find()
    .populate('userId', 'firstName lastName email')
    .sort({ updatedAt: -1 })
    .lean();
  const list = profiles.map((p) => ({
    _id: p._id,
    userId: p.userId,
    skills: p.skills,
    portfolio: p.portfolio,
    availability: p.availability,
  }));
  res.status(200).json({ success: true, contributors: list });
});

/** GET /contributor-profile/:id – get by id: own gets full; others get public fields */
export const getContributorProfileById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const profileId = req.params.id;
  const currentUser = req.user as { _id?: unknown; role?: string } | undefined;
  const currentUserId = currentUser?._id != null ? String(currentUser._id) : null;

  const profile = await ContributorProfileModel.findById(profileId)
    .populate('userId', 'firstName lastName email')
    .lean();
  if (!profile) return next(new ErrorHandler('Contributor profile not found', 404));

  const profileUserId = (profile.userId as { _id?: unknown })?._id != null ? String((profile.userId as { _id: unknown })._id) : String(profile.userId);
  const isOwn = currentUserId && profileUserId === currentUserId;

  if (isOwn) return res.status(200).json({ success: true, profile });

  const publicProfile = {
    _id: profile._id,
    userId: profile.userId,
    skills: profile.skills,
    portfolio: profile.portfolio,
    availability: profile.availability,
  };
  res.status(200).json({ success: true, profile: publicProfile });
});
