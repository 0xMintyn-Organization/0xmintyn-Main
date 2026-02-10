/**
 * EqualUSD – Balance and transaction history API.
 */
import { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middleware/catchAsyncError';
import ErrorHandler from '../utils/errorHandler';
import { getEqualUsdBalance } from '../services/equalUsd.service';
import EqualUsdTransactionModel from '../models/equalUsdTransaction.model';

/** GET /equalusd/balance – Current user's EqualUSD balance. */
export const getBalance = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler('User not authenticated', 401));
    }
    const balance = await getEqualUsdBalance(userId);
    res.status(200).json({
      success: true,
      balance,
      currency: 'EqualUSD',
    });
  }
);

/** GET /equalusd/transactions – Paginated transaction history. */
export const getTransactions = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new ErrorHandler('User not authenticated', 401));
    }
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit)) || 20));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      EqualUsdTransactionModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EqualUsdTransactionModel.countDocuments({ userId }),
    ]);

    res.status(200).json({
      success: true,
      transactions: transactions.map((t) => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);
