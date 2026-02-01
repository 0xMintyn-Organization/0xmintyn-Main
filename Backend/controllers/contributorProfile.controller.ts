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
      paymentMethod: { methodType: '' },
      earningsSummary: 0,
      availability: '',
    });
    profile = newProfile.toObject();
  }
  res.status(200).json({ success: true, profile: profile });
});

/** PUT /contributor-profile – create or update own contributor profile */
export const putContributorProfile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id;
  if (!userId) return next(new ErrorHandler('Unauthorized', 401));

  const user = await UserModel.findById(userId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'contributor') return next(new ErrorHandler('Only contributor users can update contributor profile', 403));

  const {
    image,
    headline,
    bio,
    experience,
    location,
    skills,
    portfolio,
    availability,
    linkedIn,
    website,
    github,
    paymentMethod: pmBody,
    earningsSummary,
  } = req.body as Partial<IContributorProfile> & { linkedIn?: string; website?: string; github?: string; paymentMethod?: Record<string, unknown> };
  const update: Record<string, unknown> = {};
  if (image != null && typeof image === 'string') update.image = image.trim();
  if (headline != null && typeof headline === 'string') update.headline = headline.trim();
  if (bio != null && typeof bio === 'string') update.bio = bio.trim();
  if (experience != null && typeof experience === 'string') update.experience = experience.trim();
  if (location != null && typeof location === 'string') update.location = location.trim();
  if (Array.isArray(skills)) update.skills = skills.filter((s: unknown) => typeof s === 'string');
  if (portfolio != null && typeof portfolio === 'string') update.portfolio = portfolio.trim();
  if (availability != null && typeof availability === 'string') update.availability = availability.trim();
  if (linkedIn != null && typeof linkedIn === 'string') update.linkedIn = linkedIn.trim();
  if (website != null && typeof website === 'string') update.website = website.trim();
  if (github != null && typeof github === 'string') update.github = github.trim();
  if (pmBody != null && typeof pmBody === 'object') {
    const pm: Record<string, string> = {};
    const methodType = typeof pmBody.methodType === 'string' && ['card', 'paypal', 'bank', 'crypto', ''].includes(pmBody.methodType) ? pmBody.methodType : '';
    pm.methodType = methodType;
    if (methodType === 'card') {
      if (typeof pmBody.cardLast4 === 'string') pm.cardLast4 = pmBody.cardLast4.replace(/\D/g, '').slice(-4);
      if (typeof pmBody.cardExpiry === 'string') pm.cardExpiry = pmBody.cardExpiry.trim();
      if (typeof pmBody.cardholderName === 'string') pm.cardholderName = pmBody.cardholderName.trim();
    } else if (methodType === 'paypal' && typeof pmBody.paypalEmail === 'string') {
      pm.paypalEmail = pmBody.paypalEmail.trim();
    } else if (methodType === 'bank') {
      if (typeof pmBody.bankName === 'string') pm.bankName = pmBody.bankName.trim();
      if (typeof pmBody.accountHolderName === 'string') pm.accountHolderName = pmBody.accountHolderName.trim();
      if (typeof pmBody.accountLast4 === 'string') pm.accountLast4 = pmBody.accountLast4.replace(/\D/g, '').slice(-4);
      if (typeof pmBody.routing === 'string') pm.routing = pmBody.routing.trim();
    } else if (methodType === 'crypto' && typeof pmBody.cryptoAddress === 'string') {
      pm.cryptoAddress = pmBody.cryptoAddress.trim();
    }
    update.paymentMethod = pm;
  }
  if (typeof earningsSummary === 'number' && !isNaN(earningsSummary)) update.earningsSummary = earningsSummary;

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
    image: p.image,
    headline: p.headline,
    bio: p.bio,
    experience: p.experience,
    location: p.location,
    skills: p.skills,
    portfolio: p.portfolio,
    availability: p.availability,
    linkedIn: p.linkedIn,
    website: p.website,
    github: p.github,
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
    image: profile.image,
    headline: profile.headline,
    bio: profile.bio,
    experience: profile.experience,
    location: profile.location,
    skills: profile.skills,
    portfolio: profile.portfolio,
    availability: profile.availability,
    linkedIn: profile.linkedIn,
    website: profile.website,
    github: profile.github,
  };
  res.status(200).json({ success: true, profile: publicProfile });
});
