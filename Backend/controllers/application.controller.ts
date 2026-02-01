require('dotenv').config();
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ApplicationModel, { APPLICATION_STATUSES, ApplicationStatus } from '../models/application.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** POST /application – contributor applies to a startup (body: startupId, coverMessage?) */
export const createApplication = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const contributorId = (req.user as { _id: string })._id;
  const user = await UserModel.findById(contributorId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'contributor') return next(new ErrorHandler('Only contributors can apply to startups', 403));

  const { startupId, coverMessage } = req.body as { startupId?: string; coverMessage?: string };
  if (!startupId) return next(new ErrorHandler('startupId is required', 400));

  const startup = await UserModel.findById(startupId);
  if (!startup) return next(new ErrorHandler('Startup not found', 404));
  if (startup.marketplace_role !== 'startup') return next(new ErrorHandler('Target user is not a startup', 400));

  const existing = await ApplicationModel.findOne({ startupId, contributorId });
  if (existing) return next(new ErrorHandler('You have already applied to this startup', 400));

  const application = await ApplicationModel.create({
    startupId,
    contributorId,
    status: 'pending',
    coverMessage: typeof coverMessage === 'string' ? coverMessage.trim() : '',
  });
  const populated = await ApplicationModel.findById(application._id)
    .populate('startupId', 'email startupName firstName lastName')
    .populate('contributorId', 'email firstName lastName')
    .lean();
  res.status(201).json({ success: true, application: populated });
});

/** PATCH /application/:id – startup accepts or rejects (only startup owner) */
export const patchApplication = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const applicationId = req.params.id;
  const user = req.user as { _id: string; role: string; marketplace_role?: string };
  const { status } = req.body as { status?: string };

  if (!status || !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    return next(new ErrorHandler('Valid status required: pending, accepted, rejected', 400));
  }

  const application = await ApplicationModel.findById(applicationId);
  if (!application) return next(new ErrorHandler('Application not found', 404));

  const isStartupOwner = String(application.startupId) === String(user._id);
  const isAdmin = user.role === 'admin';
  if (!isStartupOwner && !isAdmin) return next(new ErrorHandler('Only the startup owner or admin can update this application', 403));

  application.status = status as ApplicationStatus;
  await application.save();

  const populated = await ApplicationModel.findById(application._id)
    .populate('contributorId', 'email firstName lastName')
    .populate('startupId', 'email startupName')
    .lean();
  res.status(200).json({ success: true, application: populated });
});

/** GET /application – contributor: my applications to startups; startup: applications to me */
export const listMyApplications = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as { _id: string; role: string; marketplace_role?: string };

  if (user.marketplace_role === 'contributor') {
    const applications = await ApplicationModel.find({ contributorId: user._id })
      .populate('startupId', 'email startupName firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, applications });
  }

  if (user.marketplace_role === 'startup') {
    const applications = await ApplicationModel.find({ startupId: user._id })
      .populate('contributorId', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, applications });
  }

  return next(new ErrorHandler('Not authorized', 403));
});
