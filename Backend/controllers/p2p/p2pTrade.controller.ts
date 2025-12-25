import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CatchAsyncError } from '../../middleware/catchAsyncError';
import ErrorHandler from '../../utils/errorHandler';
import P2PTradeModel from '../../models/p2p/p2pTrade.model';
import P2POfferModel from '../../models/p2p/p2pOffer.model';
import P2PMessageModel from '../../models/p2p/p2pMessage.model';
import UserModel from '../../models/user.mode';
import { getExchangeNamespace } from '../../socketServer';
import { logger } from '../../utils/logger';

// Create a new P2P trade (order)
export const createP2PTrade = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { offerId, amount, paymentMethod } = req.body;

      if (!offerId || !amount || !paymentMethod) {
        return next(new ErrorHandler('Missing required fields: offerId, amount, paymentMethod', 400));
      }

      // Fetch the offer
      const offer = await P2POfferModel.findById(offerId).populate('traderId', 'firstName lastName username email');
      if (!offer) {
        return next(new ErrorHandler('Offer not found', 404));
      }

      if (!offer.isActive || !offer.isOnline) {
        return next(new ErrorHandler('Offer is not available', 400));
      }

      // Determine buyer and seller based on offer side
      // If offer.side === 'sell', the merchant is selling, so userId is buying
      // If offer.side === 'buy', the merchant is buying, so userId is selling
      const buyerId = offer.side === 'sell' ? userId : offer.traderId._id;
      const sellerId = offer.side === 'sell' ? offer.traderId._id : userId;

      // Validate amount
      if (amount < offer.minLimit || amount > offer.maxLimit) {
        return next(new ErrorHandler(`Amount must be between ${offer.minLimit} and ${offer.maxLimit}`, 400));
      }

      if (amount > offer.available) {
        return next(new ErrorHandler(`Available amount is ${offer.available}`, 400));
      }

      // Validate payment method
      if (!offer.paymentMethods.includes(paymentMethod)) {
        return next(new ErrorHandler('Payment method not supported by this offer', 400));
      }

      // Calculate total price
      const totalPrice = amount * offer.price;

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + offer.timeLimit);

      // Create trade
      const trade = await P2PTradeModel.create({
        offerId: offer._id,
        buyerId,
        sellerId,
        asset: offer.asset,
        side: offer.side === 'sell' ? 'buy' : 'sell', // Trade side is opposite of offer side
        amount,
        price: offer.price,
        totalPrice,
        paymentMethod,
        timeLimit: offer.timeLimit,
        expiresAt,
        status: 'pending',
      });

      // Populate buyer and seller info
      await trade.populate('buyerId', 'firstName lastName username email avatar');
      await trade.populate('sellerId', 'firstName lastName username email avatar');

      // Emit WebSocket event to notify both buyer and seller
      const exchangeNamespace = getExchangeNamespace();
      if (exchangeNamespace) {
        const buyer = trade.buyerId as any;
        const seller = trade.sellerId as any;
        
        const buyerName = buyer?.firstName && buyer?.lastName
          ? `${buyer.firstName} ${buyer.lastName}`
          : buyer?.username || buyer?.email || 'Buyer';

        const sellerName = seller?.firstName && seller?.lastName
          ? `${seller.firstName} ${seller.lastName}`
          : seller?.username || seller?.email || 'Seller';

        // Create trade data with correct counterparty info for each user
        const buyerTradeData = {
          id: trade._id.toString(),
          tradeNumber: trade.tradeNumber,
          asset: trade.asset,
          fiat: 'USD',
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
          totalFiat: trade.totalPrice,
          paymentMethod: trade.paymentMethod,
          buyerUserId: buyer?._id?.toString() || '',
          sellerUserId: seller?._id?.toString() || '',
          buyerName,
          sellerName,
          counterpartyUserId: seller?._id?.toString() || '', // For buyer, counterparty is seller
          counterpartyName: sellerName,
          traderId: seller?._id?.toString() || '',
          status: trade.status,
          timeLimit: trade.timeLimit,
          expiresAt: trade.expiresAt,
          createdAt: trade.createdAt,
        };

        const sellerTradeData = {
          id: trade._id.toString(),
          tradeNumber: trade.tradeNumber,
          asset: trade.asset,
          fiat: 'USD',
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
          totalFiat: trade.totalPrice,
          paymentMethod: trade.paymentMethod,
          buyerUserId: buyer?._id?.toString() || '',
          sellerUserId: seller?._id?.toString() || '',
          buyerName,
          sellerName,
          counterpartyUserId: buyer?._id?.toString() || '', // For seller, counterparty is buyer
          counterpartyName: buyerName,
          traderId: seller?._id?.toString() || '',
          status: trade.status,
          timeLimit: trade.timeLimit,
          expiresAt: trade.expiresAt,
          createdAt: trade.createdAt,
        };

        // Emit to both buyer and seller with correct counterparty info
        exchangeNamespace.to(`user:${buyerId}`).emit('p2p:order:created', buyerTradeData);
        exchangeNamespace.to(`user:${sellerId}`).emit('p2p:order:created', sellerTradeData);

        // Automatically join both buyer and seller to the order room
        // This ensures they can receive messages immediately
        const roomName = `order:${trade._id.toString()}`;
        exchangeNamespace.in(`user:${buyerId}`).socketsJoin(roomName);
        exchangeNamespace.in(`user:${sellerId}`).socketsJoin(roomName);
        logger.info(`📥 Auto-joined buyer (${buyerId}) and seller (${sellerId}) to room: ${roomName}`);

        // Save initial message from seller to database (like Binance/Facebook Messenger)
        const initialMessageText = `Order created. Please complete payment via ${paymentMethod} within ${offer.timeLimit} minutes.`;
        const savedInitialMessage = await P2PMessageModel.create({
          orderId: trade._id,
          senderId: sellerId,
          message: initialMessageText,
          isRead: false,
        });

        // Create message object for WebSocket broadcast (using saved message ID)
        const initialMessage = {
          id: savedInitialMessage._id.toString(),
          orderId: trade._id.toString(),
          senderUserId: sellerId.toString(),
          message: initialMessageText,
          createdAt: savedInitialMessage.createdAt.toISOString(),
          isRead: false,
          attachments: [],
        };
        
        // Emit to order room (both buyer and seller are now in this room)
        exchangeNamespace.in(roomName).emit('p2p:message:new', initialMessage);
        logger.info(`💬 Initial message saved and broadcasted for order ${trade._id.toString()}`);
      }

      res.status(201).json({
        success: true,
        message: 'Trade created successfully',
        trade: {
          id: trade._id.toString(),
          tradeNumber: trade.tradeNumber,
          offerId: trade.offerId.toString(),
          buyerId: trade.buyerId,
          sellerId: trade.sellerId,
          asset: trade.asset,
          side: trade.side,
          amount: trade.amount,
          price: trade.price,
          totalPrice: trade.totalPrice,
          paymentMethod: trade.paymentMethod,
          status: trade.status,
          timeLimit: trade.timeLimit,
          expiresAt: trade.expiresAt,
          createdAt: trade.createdAt,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all trades for the authenticated user (both as buyer and seller)
export const getMyTrades = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { status } = req.query;

      const query: any = {
        $or: [{ buyerId: userId }, { sellerId: userId }],
      };

      if (status) {
        query.status = status;
      }

      const trades = await P2PTradeModel.find(query)
        .populate('buyerId', 'firstName lastName username email avatar')
        .populate('sellerId', 'firstName lastName username email avatar')
        .populate('offerId', 'asset side price paymentMethods')
        .sort({ createdAt: -1 })
        .limit(100);

      const transformedTrades = trades.map((trade) => {
        const buyer = trade.buyerId as any;
        const seller = trade.sellerId as any;
        const currentUserIsBuyer = String(buyer._id) === String(userId);
        const counterparty = currentUserIsBuyer ? seller : buyer;

        const buyerName = buyer?.firstName && buyer?.lastName
          ? `${buyer.firstName} ${buyer.lastName}`
          : buyer?.username || buyer?.email || 'Buyer';

        const sellerName = seller?.firstName && seller?.lastName
          ? `${seller.firstName} ${seller.lastName}`
          : seller?.username || seller?.email || 'Seller';

        const counterpartyName = counterparty?.firstName && counterparty?.lastName
          ? `${counterparty.firstName} ${counterparty.lastName}`
          : counterparty?.username || counterparty?.email || 'Counterparty';

        return {
          id: trade._id.toString(),
          tradeNumber: trade.tradeNumber,
          asset: trade.asset,
          fiat: 'USD', // Default fiat
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
          totalFiat: trade.totalPrice,
          paymentMethod: trade.paymentMethod,
          buyerUserId: buyer?._id?.toString() || '',
          sellerUserId: seller?._id?.toString() || '',
          buyerName,
          sellerName,
          counterpartyUserId: counterparty?._id?.toString() || '',
          counterpartyName,
          traderId: seller?._id?.toString() || '', // For fetching merchant profile
          status: trade.status,
          timeLimit: trade.timeLimit,
          expiresAt: trade.expiresAt,
          createdAt: trade.createdAt,
        };
      });

      res.status(200).json({
        success: true,
        trades: transformedTrades,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get a single trade by ID
export const getTradeById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id;
      if (!userId) {
        return next(new ErrorHandler('User not authenticated', 401));
      }

      const { tradeId } = req.params;

      // Check if tradeId is a valid MongoDB ObjectId
      // If it starts with 'p2p_', it's from old sessionStorage format, not a valid ObjectId
      if (!tradeId || tradeId.startsWith('p2p_') || !mongoose.Types.ObjectId.isValid(tradeId)) {
        return next(new ErrorHandler('Invalid trade ID format', 400));
      }

      const trade = await P2PTradeModel.findById(tradeId)
        .populate('buyerId', 'firstName lastName username email avatar')
        .populate('sellerId', 'firstName lastName username email avatar')
        .populate('offerId', 'asset side price paymentMethods');

      if (!trade) {
        return next(new ErrorHandler('Trade not found', 404));
      }

      // Check if user is part of this trade
      // Handle both ObjectId and populated user object cases
      const buyerId = trade.buyerId?._id ? String(trade.buyerId._id) : String(trade.buyerId);
      const sellerId = trade.sellerId?._id ? String(trade.sellerId._id) : String(trade.sellerId);
      const currentUserId = String(userId);

      if (buyerId !== currentUserId && sellerId !== currentUserId) {
        return next(new ErrorHandler('Unauthorized access to this trade', 403));
      }

      const buyer = trade.buyerId as any;
      const seller = trade.sellerId as any;
      const currentUserIsBuyer = String(buyer._id) === String(userId);
      const counterparty = currentUserIsBuyer ? seller : buyer;

      const buyerName = buyer?.firstName && buyer?.lastName
        ? `${buyer.firstName} ${buyer.lastName}`
        : buyer?.username || buyer?.email || 'Buyer';

      const sellerName = seller?.firstName && seller?.lastName
        ? `${seller.firstName} ${seller.lastName}`
        : seller?.username || seller?.email || 'Seller';

      const counterpartyName = counterparty?.firstName && counterparty?.lastName
        ? `${counterparty.firstName} ${counterparty.lastName}`
        : counterparty?.username || counterparty?.email || 'Counterparty';

      res.status(200).json({
        success: true,
        trade: {
          id: trade._id.toString(),
          tradeNumber: trade.tradeNumber,
          asset: trade.asset,
          fiat: 'USD',
          side: trade.side,
          price: trade.price,
          amount: trade.amount,
          totalFiat: trade.totalPrice,
          paymentMethod: trade.paymentMethod,
          buyerUserId: buyer?._id?.toString() || '',
          sellerUserId: seller?._id?.toString() || '',
          buyerName,
          sellerName,
          counterpartyUserId: counterparty?._id?.toString() || '',
          counterpartyName,
          traderId: seller?._id?.toString() || '',
          status: trade.status,
          timeLimit: trade.timeLimit,
          expiresAt: trade.expiresAt,
          createdAt: trade.createdAt,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

