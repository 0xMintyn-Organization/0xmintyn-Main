require('dotenv').config();
import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ApplicationModel, { APPLICATION_STATUSES, ApplicationStatus } from '../models/application.model';
import EngagementModel from '../models/engagement.model';
import UserModel from '../models/user.mode';
import ErrorHandler from '../utils/errorHandler';

/** POST /application – contributor applies to a startup (body: startupId, coverMessage?, cvUrl?, monthlySalary?). Rejected can apply again (reopens that application). */
export const createApplication = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const contributorId = (req.user as { _id: string })._id;
  const user = await UserModel.findById(contributorId);
  if (!user) return next(new ErrorHandler('User not found', 404));
  if (user.marketplace_role !== 'contributor') return next(new ErrorHandler('Only contributors can apply to startups', 403));

  const { startupId, coverMessage, cvUrl, monthlySalary } = req.body as {
    startupId?: string;
    coverMessage?: string;
    cvUrl?: string;
    monthlySalary?: number;
  };
  if (!startupId) return next(new ErrorHandler('startupId is required', 400));

  const startup = await UserModel.findById(startupId);
  if (!startup) return next(new ErrorHandler('Startup not found', 404));
  if (startup.marketplace_role !== 'startup') return next(new ErrorHandler('Target user is not a startup', 400));

  const sid = new mongoose.Types.ObjectId(startupId);
  const cid = new mongoose.Types.ObjectId(contributorId);

  const latest = await ApplicationModel.findOne({ startupId: sid, contributorId: cid })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  if (latest) {
    if (latest.status === 'pending' || latest.status === 'accepted') {
      return next(new ErrorHandler('You already have an active application to this startup', 400));
    }
    if (latest.status === 'rejected') {
      const salary =
        typeof monthlySalary === 'number' && !isNaN(monthlySalary) && monthlySalary >= 0 ? monthlySalary : undefined;
      const updated = await ApplicationModel.findByIdAndUpdate(
        latest._id,
        {
          status: 'pending',
          coverMessage: typeof coverMessage === 'string' ? coverMessage.trim() : '',
          cvUrl: typeof cvUrl === 'string' ? cvUrl.trim() : undefined,
          monthlySalary: salary ?? undefined,
        },
        { new: true }
      );
      const populated = await ApplicationModel.findById(updated!._id)
        .populate('startupId', 'email startupName firstName lastName')
        .populate('contributorId', 'email firstName lastName')
        .lean();
      return res.status(200).json({ success: true, application: populated });
    }
  }

  const salary =
    typeof monthlySalary === 'number' && !isNaN(monthlySalary) && monthlySalary >= 0 ? monthlySalary : undefined;

  const application = await ApplicationModel.create({
    startupId: sid,
    contributorId: cid,
    status: 'pending',
    coverMessage: typeof coverMessage === 'string' ? coverMessage.trim() : '',
    cvUrl: typeof cvUrl === 'string' ? cvUrl.trim() : undefined,
    monthlySalary: salary,
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

  if (status === 'accepted') {
    const existing = await EngagementModel.findOne({ startupId: application.startupId, contributorId: application.contributorId });
    if (!existing) {
      await EngagementModel.create({
        startupId: application.startupId,
        contributorId: application.contributorId,
        applicationId: application._id,
        startDate: new Date(),
        agreedSalary: application.monthlySalary ?? 0,
        status: 'active',
      });
    }
  }

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
