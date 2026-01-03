import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import UserModel from "../../models/user.mode";
import { submitSignedTransaction } from "../../utils/mintynPayment";
import { Connection, PublicKey } from "@solana/web3.js";
import { checkMintynBalance, RPC_URL } from "../../utils/mintynPayment";

// Helper function to update seller stats after order creation
const updateSellerStatsAfterOrder = async (sellerId: string, orderItems: any[], totalAmount: number) => {
  try {
    console.log('🔄 Updating seller stats for sellerId:', sellerId, 'totalAmount:', totalAmount);
    console.log('📦 Order items:', orderItems.map(item => `${item.itemTitle} (${item.itemType}) x${item.quantity}`));
    
    // Update seller's total earnings
    const sellerUpdate = await MarketplaceSellerModel.findByIdAndUpdate(
      sellerId,
      {
        $inc: {
          totalEarnings: totalAmount,
          totalSales: 1
        }
      },
      { new: true }
    );
    console.log('💰 Seller earnings updated:', sellerUpdate?.totalEarnings, 'Sales count:', sellerUpdate?.totalSales);

    // Update individual product/service sales count
    for (const item of orderItems) {
      if (item.itemType === 'product') {
        const productUpdate = await MarketplaceProductModel.findByIdAndUpdate(
          item.itemId,
          {
            $inc: {
              salesCount: item.quantity
            }
          },
          { new: true }
        );
        console.log(`📈 Updated product ${item.itemId} (${item.itemTitle}) sales count from ${(productUpdate?.salesCount || 0) - item.quantity} to ${productUpdate?.salesCount}`);
      } else if (item.itemType === 'service') {
        const serviceUpdate = await MarketplaceServiceModel.findByIdAndUpdate(
          item.itemId,
          {
            $inc: {
              orderCount: item.quantity
            }
          },
          { new: true }
        );
        console.log(`📈 Updated service ${item.itemId} (${item.itemTitle}) order count from ${(serviceUpdate?.orderCount || 0) - item.quantity} to ${serviceUpdate?.orderCount}`);
      }
    }

    console.log('✅ Seller stats updated successfully');
  } catch (error) {
    console.error('❌ Error updating seller stats:', error);
    // Don't throw error to avoid breaking order creation
  }
};

// Create a new order
export const createMarketplaceOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { items, shippingAddress, notes } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new ErrorHandler("Order items are required", 400));
    }

    // Validate and fetch item details
    const orderItems = [];
    let totalAmount = 0;
    let sellerId = null;

    for (const item of items) {
      const { itemId, itemType, quantity = 1, packageIndex } = item;

      if (!itemId || !itemType) {
        return next(new ErrorHandler("Item ID and type are required", 400));
      }

      let itemDetails;
      let itemPrice;

      if (itemType === 'product') {
        itemDetails = await MarketplaceProductModel.findById(itemId);
        if (!itemDetails) {
          return next(new ErrorHandler(`Product with ID ${itemId} not found`, 404));
        }
        itemPrice = itemDetails.price;
      } else if (itemType === 'service') {
        itemDetails = await MarketplaceServiceModel.findById(itemId);
        if (!itemDetails) {
          return next(new ErrorHandler(`Service with ID ${itemId} not found`, 404));
        }
        
        // Handle service packages
        if (packageIndex !== undefined && itemDetails.packages && itemDetails.packages[packageIndex]) {
          itemPrice = itemDetails.packages[packageIndex].price;
        } else {
          itemPrice = itemDetails.price;
        }
      } else {
        return next(new ErrorHandler("Invalid item type", 400));
      }

      // Set seller ID (should be same for all items in an order)
      if (!sellerId) {
        sellerId = itemDetails.sellerId;
      } else if (sellerId.toString() !== itemDetails.sellerId.toString()) {
        return next(new ErrorHandler("All items must be from the same seller", 400));
      }

      const itemTotal = itemPrice * quantity;
      totalAmount += itemTotal;

      // Prepare order item
      const orderItem: any = {
        itemId,
        itemType,
        itemTitle: itemDetails.title,
        itemPrice,
        itemImage: itemDetails.thumbnailImage,
        quantity,
        totalPrice: itemTotal
      };

      // Add package details for services
      if (itemType === 'service' && packageIndex !== undefined && itemDetails.packages && itemDetails.packages[packageIndex]) {
        const packageData = itemDetails.packages[packageIndex];
        orderItem.packageDetails = {
          packageName: packageData.name,
          features: packageData.features,
          deliveryTime: itemDetails.deliveryTime,
          revisions: packageData.revisions || itemDetails.revisions
        };
      }

      // Add file details for products
      if (itemType === 'product') {
        orderItem.fileDetails = {
          fileName: itemDetails.fileName || 'Unknown',
          fileSize: itemDetails.fileSize || 'Unknown',
          fileFormat: itemDetails.fileFormat || 'Unknown',
          downloadCount: 0,
          maxDownloads: 5
        };
      }

      orderItems.push(orderItem);
    }

    // Check if order contains only products (no services)
    // Products require blockchain payment
    const isProductOnlyOrder = orderItems.every(item => item.itemType === 'product');

    // For product orders, require blockchain payment
    if (isProductOnlyOrder) {
      // Get user's wallet address
      const user = await UserModel.findById(userId).select("walletAddress");
      if (!user || !user.walletAddress) {
        return next(new ErrorHandler("Wallet address not found. Please connect your wallet first.", 400));
      }

      // Get seller's wallet address (via seller.userId -> User.walletAddress)
      const seller = await MarketplaceSellerModel.findById(sellerId).select("userId");
      if (!seller) {
        return next(new ErrorHandler("Seller not found", 404));
      }

      const sellerUser = await UserModel.findById(seller.userId).select("walletAddress");
      if (!sellerUser || !sellerUser.walletAddress) {
        return next(new ErrorHandler("Seller wallet address not found. The seller needs to connect their wallet to receive payments.", 400));
      }

      // Get signed transaction from frontend
      const { signedTransaction } = req.body;
      if (!signedTransaction) {
        return next(new ErrorHandler("Signed transaction is required. Please complete the payment in your wallet.", 400));
      }

      // Submit signed transaction to blockchain
      let transactionSignature: string;
      let sellerAmount: number;
      let adminAmount: number;

      try {
        const paymentResult = await submitSignedTransaction(
          signedTransaction,
          user.walletAddress,
          sellerUser.walletAddress,
          totalAmount
        );

        transactionSignature = paymentResult.signature;
        sellerAmount = paymentResult.instructorAmount; // 95% to seller
        adminAmount = paymentResult.adminAmount; // 5% to admin

        console.log("✅ Product payment successful!");
        console.log(`Transaction: ${transactionSignature}`);
        console.log(`Seller receives: ${sellerAmount} 0XM`);
        console.log(`Admin receives: ${adminAmount} 0XM`);
      } catch (error: any) {
        console.error("❌ Payment error:", error);
        return next(new ErrorHandler(
          error.message || "Payment failed. Please try again.",
          400
        ));
      }

      // Create the order with payment info
      const orderData: any = {
        buyerId: userId,
        sellerId,
        items: orderItems,
        orderTotal: totalAmount,
        currency: '0XM',
        paymentStatus: 'completed',
        paymentMethod: 'mintyn',
        paymentDetails: {
          transactionId: transactionSignature,
          gateway: 'solana',
          amount: totalAmount,
          fees: adminAmount,
          netAmount: sellerAmount,
          transactionSignature: transactionSignature,
          sellerAmount: sellerAmount,
          adminAmount: adminAmount
        },
        orderStatus: 'completed',
        shippingAddress,
        notes,
        isActive: true,
        completedAt: new Date(),
        startedAt: new Date()
      };

      // Generate order number before creating
      const orderCount = await MarketplaceOrderModel.countDocuments();
      const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;
      
      const order = await MarketplaceOrderModel.create({
        ...orderData,
        orderNumber
      });

      // Save purchased items to user
      const purchasedItems = orderItems.map(item => ({
        itemId: item.itemId.toString(),
        itemType: item.itemType,
        purchaseDate: new Date(),
        orderId: order._id.toString()
      }));

      // Update user with purchased items
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $push: {
            purchasedItems: { $each: purchasedItems },
            purchasedProducts: { $each: orderItems.filter(item => item.itemType === 'product').map(item => ({ productId: item.itemId.toString() })) }
          }
        },
        { new: true }
      );

      // Update seller stats
      if (sellerId) {
        await updateSellerStatsAfterOrder(sellerId.toString(), orderItems, totalAmount);
      }

      // Populate the order with buyer and seller details
      const populatedOrder = await MarketplaceOrderModel.findById(order._id)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'sellerName storeName email');

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: populatedOrder
      });

      return; // Exit early for product orders
    }

    // For service orders, create order with pending payment (existing logic)
    const orderData: any = {
      buyerId: userId,
      sellerId,
      items: orderItems,
      orderTotal: totalAmount,
      currency: '0XM',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      shippingAddress,
      notes,
      isActive: true
    };

    // Generate order number before creating
    const orderCount = await MarketplaceOrderModel.countDocuments();
    const orderNumber = `ORD-${Date.now()}-${String(orderCount + 1).padStart(4, '0')}`;
    
    const order = await MarketplaceOrderModel.create({
      ...orderData,
      orderNumber
    });

    // For service orders, save purchased items to user
    const purchasedItems = orderItems.map(item => ({
      itemId: item.itemId.toString(),
      itemType: item.itemType,
      purchaseDate: new Date(),
      orderId: order._id.toString()
    }));

    // Update user with purchased items
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          purchasedItems: { $each: purchasedItems },
          ...(orderItems.some(item => item.itemType === 'service') && {
            purchasedServices: { $each: orderItems.filter(item => item.itemType === 'service').map(item => ({ serviceId: item.itemId.toString() })) }
          })
        }
      },
      { new: true }
    );

    // Populate the order with buyer and seller details
    const populatedOrder = await MarketplaceOrderModel.findById(order._id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'sellerName storeName email');

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all orders for a buyer
export const getBuyerOrders = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const filter: any = { buyerId: userId, isActive: true };
    
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await MarketplaceOrderModel.find(filter)
      .populate('sellerId', 'sellerName storeName storeLogo')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const totalOrders = await MarketplaceOrderModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / Number(limit)),
        totalOrders,
        hasNext: Number(page) < Math.ceil(totalOrders / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching buyer orders:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all orders for a seller
export const getSellerOrders = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find seller by userId
    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return next(new ErrorHandler("Seller not found", 404));
    }

    const filter: any = { sellerId: seller._id, isActive: true };
    
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await MarketplaceOrderModel.find(filter)
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const totalOrders = await MarketplaceOrderModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalOrders / Number(limit)),
        totalOrders,
        hasNext: Number(page) < Math.ceil(totalOrders / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching seller orders:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get order by ID
export const getOrderById = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // First try to find the order
    let order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      isActive: true,
      buyerId: userId
    })
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'userId sellerName storeName storeLogo email');

    // If not found as buyer, check if user is the seller
    if (!order) {
      const seller = await MarketplaceSellerModel.findOne({ userId });
      if (seller) {
        order = await MarketplaceOrderModel.findOne({
          _id: orderId,
          isActive: true,
          sellerId: seller._id
        })
          .populate('buyerId', 'firstName lastName email')
          .populate('sellerId', 'userId sellerName storeName storeLogo email');
      }
    }

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error: any) {
    console.error('Error fetching order:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Update order status
export const updateOrderStatus = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus, notes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      isActive: true
    });

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Check if user has permission to update this order
    const isBuyer = order.buyerId.toString() === userId.toString();
    const isSeller = order.sellerId.toString() === userId.toString();

    if (!isBuyer && !isSeller) {
      return next(new ErrorHandler("Not authorized to update this order", 403));
    }

    // Update order status
    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes) updateData.notes = notes;

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('buyerId', 'name email')
      .populate('sellerId', 'sellerName storeName storeLogo email');

    // Update seller stats if order is completed
    if (orderStatus === 'completed' && updatedOrder && updatedOrder.sellerId) {
      console.log('🎯 Order status updated to completed - updating seller stats');
      await updateSellerStatsAfterOrder(updatedOrder.sellerId._id, updatedOrder.items, updatedOrder.orderTotal);
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Request order cancellation (Buyer only)
export const cancelOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true
    });

    if (!order) {
      return next(new ErrorHandler("Order not found", 404));
    }

    // Check if order can be cancelled
    const canBeCancelled = ['pending', 'confirmed', 'processing'].includes(order.orderStatus) && 
                          order.orderStatus !== 'cancelled';
    
    if (!canBeCancelled) {
      return next(new ErrorHandler("Order cannot be cancelled at this stage", 400));
    }

    // Check if there's already a pending cancellation request
    if (order.cancellationRequest && order.cancellationRequest.status === 'pending') {
      return next(new ErrorHandler("You already have a pending cancellation request", 400));
    }

    // Create cancellation request
    const cancellationRequest = {
      requestedAt: new Date(),
      requestedBy: userId,
      cancellationReason: cancellationReason?.trim() || 'No reason provided',
      status: 'pending' as const
    };

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      { 
        cancellationRequest,
        $push: {
          statusHistory: {
            status: 'cancellation_requested',
            timestamp: new Date(),
            note: `Cancellation requested: ${cancellationRequest.cancellationReason}`
          }
        }
      },
      { new: true, runValidators: true }
    )
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'userId sellerName storeName storeLogo email');

    res.status(200).json({
      success: true,
      message: "Cancellation request sent to seller. Waiting for seller's response.",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error requesting cancellation:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Respond to cancellation request (Seller only)
export const respondToCancellation = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { action, responseMessage } = req.body; // action: 'accept' or 'reject'
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the seller profile
    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return next(new ErrorHandler("Seller profile not found", 404));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      sellerId: seller._id,
      isActive: true
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to respond to this cancellation", 404));
    }

    // Check if there's a pending cancellation request
    if (!order.cancellationRequest || order.cancellationRequest.status !== 'pending') {
      return next(new ErrorHandler("No pending cancellation request found", 400));
    }

    let updateData: any = {
      'cancellationRequest.respondedAt': new Date(),
      'cancellationRequest.responseMessage': responseMessage?.trim() || ''
    };

    if (action === 'accept') {
      // Refund escrow if payment was via escrow
      let escrowRefundSignature = null;
      if (order.paymentDetails?.escrowAccount && order.paymentMethod === 'escrow') {
        try {
          const { refundEscrow } = require("../../utils/escrowContract");
          
          // Get buyer and seller wallet addresses
          const buyerUser = await UserModel.findById(order.buyerId).select('walletAddress');
          const sellerUser = await MarketplaceSellerModel
            .findById(order.sellerId)
            .populate('userId', 'walletAddress')
            .select('userId');
          
          if (buyerUser?.walletAddress && sellerUser?.userId?.walletAddress) {
            const buyerWallet = new PublicKey(buyerUser.walletAddress);
            const sellerWallet = new PublicKey(sellerUser.userId.walletAddress);
            
            // Get offer ID from order (required for PDA derivation)
            if (!order.offerId) {
              throw new Error("Order missing offerId - cannot refund escrow");
            }
            const offerId = order.offerId.toString();
            
            console.log('📤 Calling refundEscrow with offerId:', offerId);
            const result = await refundEscrow(buyerWallet, sellerWallet, offerId);
            escrowRefundSignature = result.signature;
            
            console.log('✅ Escrow refunded:', escrowRefundSignature);
          }
        } catch (error: any) {
          console.error('❌ Error refunding escrow:', error);
          // Don't fail the cancellation if escrow refund fails
          // Admin can manually refund later
        }
      }

      updateData['cancellationRequest.status'] = 'accepted';
      updateData.orderStatus = 'cancelled';
      updateData.paymentStatus = 'refunded'; // Changed to 'refunded' for escrow
      updateData.cancelledAt = new Date();
      
      // Add escrow refund signature if available
      if (escrowRefundSignature && order.paymentDetails) {
        updateData['paymentDetails.escrowRefundSignature'] = escrowRefundSignature;
        updateData['paymentDetails.buyerAmount'] = order.orderTotal * 0.95; // 95% to buyer
        updateData['paymentDetails.adminAmount'] = order.orderTotal * 0.05; // 5% to admin
      }
      
      updateData.$push = {
        statusHistory: {
          status: 'cancelled',
          timestamp: new Date(),
          note: escrowRefundSignature 
            ? 'Cancellation accepted by seller. Escrow refunded (95% buyer, 5% admin).'
            : 'Cancellation accepted by seller'
        }
      };
    } else if (action === 'reject') {
      updateData['cancellationRequest.status'] = 'rejected';
      updateData.$push = {
        statusHistory: {
          status: order.orderStatus, // Keep current status
          timestamp: new Date(),
          note: 'Cancellation request rejected by seller. Order continues.'
        }
      };
    } else {
      return next(new ErrorHandler("Invalid action. Must be 'accept' or 'reject'", 400));
    }

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    res.status(200).json({
      success: true,
      message: `Cancellation request ${action}ed successfully`,
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error responding to cancellation:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get user's purchased items
export const getPurchasedItems = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, itemType } = req.query;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const filter: any = { 
      buyerId: userId, 
      isActive: true,
      paymentStatus: 'completed',
      orderStatus: { $in: ['confirmed', 'processing', 'completed'] }
    };

    if (itemType) {
      filter['items.itemType'] = itemType;
    }

    const orders = await MarketplaceOrderModel.find(filter)
      .populate('sellerId', 'sellerName storeName storeLogo')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Extract items from orders
    const purchasedItems = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemType || item.itemType === itemType) {
        purchasedItems.push({
          ...item,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          seller: order.sellerId
        });
        }
      });
    });

    const totalItems = await MarketplaceOrderModel.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      { $match: itemType ? { 'items.itemType': itemType } : {} },
      { $count: 'total' }
    ]);

    res.status(200).json({
      success: true,
      items: purchasedItems,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil((totalItems[0]?.total || 0) / Number(limit)),
        totalItems: totalItems[0]?.total || 0,
        hasNext: Number(page) < Math.ceil((totalItems[0]?.total || 0) / Number(limit)),
        hasPrev: Number(page) > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching purchased items:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get user's purchased items from user model
export const getUserPurchasedItems = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, itemType } = req.query;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Get user with purchased items
    const user = await UserModel.findById(userId)
      .select('purchasedItems purchasedProducts purchasedServices')
      .lean();

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Filter by item type if specified
    let purchasedItems = user.purchasedItems || [];
    if (itemType) {
      purchasedItems = purchasedItems.filter(item => item.itemType === itemType);
    }

    // Get detailed item information
    const detailedItems = [];
    
    for (const item of purchasedItems) {
      let itemDetails = null;
      
      if (item.itemType === 'product') {
        itemDetails = await MarketplaceProductModel.findById(item.itemId)
          .select('-fileUrl -previewUrl') // Exclude sensitive fields
          .populate('sellerId', 'sellerName storeName storeLogo');
      } else if (item.itemType === 'service') {
        itemDetails = await MarketplaceServiceModel.findById(item.itemId)
          .populate('sellerId', 'sellerName storeName storeLogo');
      }

      if (itemDetails) {
        detailedItems.push({
          ...item,
          itemDetails,
          purchaseDate: item.purchaseDate,
          orderId: item.orderId
        });
      }
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedItems = detailedItems.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      items: paginatedItems,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(detailedItems.length / Number(limit)),
        totalItems: detailedItems.length,
        hasNext: endIndex < detailedItems.length,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error: any) {
    console.error('Error fetching user purchased items:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get order statistics
export const getOrderStatistics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;
    const { period = '30d' } = req.query;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get buyer statistics
    const buyerStats = await MarketplaceOrderModel.aggregate([
      {
        $match: {
          buyerId: userId,
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$orderTotal' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get seller statistics
    const seller = await MarketplaceSellerModel.findOne({ userId });
    let sellerStats = [];
    
    if (seller) {
      sellerStats = await MarketplaceOrderModel.aggregate([
        {
          $match: {
            sellerId: seller._id,
            isActive: true,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalEarnings: { $sum: '$orderTotal' },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$orderStatus', 'completed'] }, 1, 0] }
            }
          }
        }
      ]);
    }

    res.status(200).json({
      success: true,
      statistics: {
        buyer: buyerStats[0] || { totalOrders: 0, totalSpent: 0, completedOrders: 0 },
        seller: sellerStats[0] || { totalOrders: 0, totalEarnings: 0, completedOrders: 0 },
        period
      }
    });

  } catch (error: any) {
    console.error('Error fetching order statistics:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Deliver order (seller only)
export const deliverOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { deliveryMessage } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the seller profile
    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return next(new ErrorHandler("Seller profile not found", 404));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      sellerId: seller._id,
      isActive: true
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to deliver this order", 404));
    }

    // Check if order can be delivered
    if (order.orderStatus !== 'processing') {
      return next(new ErrorHandler(`Cannot deliver order with status: ${order.orderStatus}`, 400));
    }

    // Handle file uploads
    const deliveryFiles = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        deliveryFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          fileUrl: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });
      }
    }

    // Update order with delivery information
    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'delivered',
        deliveryDate: new Date(),
        deliveryMessage,
        deliveryFiles,
        $push: {
          statusHistory: {
            status: 'delivered',
            timestamp: new Date(),
            note: 'Order delivered by seller'
          }
        }
      },
      { new: true }
    ).populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    // Update seller stats
    await MarketplaceSellerModel.findByIdAndUpdate(
      seller._id,
      {
        $inc: { totalSales: 1 }
      }
    );

    res.status(200).json({
      success: true,
      message: "Order delivered successfully",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error delivering order:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Download delivery file (buyer only)
export const downloadDeliveryFile = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, fileId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true,
      orderStatus: { $in: ['delivered', 'completed', 'revision_requested'] }
    }).populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to download this file", 404));
    }

    // First try to find the file in delivery files
    let deliveryFile = order.deliveryFiles?.find(file => file.filename === fileId);
    
    // If not found in delivery files, check revision files
    if (!deliveryFile && order.revisionRequest?.revisionFiles) {
      deliveryFile = order.revisionRequest.revisionFiles.find(file => file.filename === fileId);
    }
    
    if (!deliveryFile) {
      return next(new ErrorHandler("File not found in this order", 404));
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${deliveryFile.originalName}"`);
    res.setHeader('Content-Type', deliveryFile.mimeType);
    res.setHeader('Content-Length', deliveryFile.fileSize);

    // Stream the file
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(process.cwd(), deliveryFile.fileUrl);
    
    if (!fs.existsSync(filePath)) {
      return next(new ErrorHandler("File not found on server", 404));
    }

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error: any) => {
      console.error('File stream error:', error);
      return next(new ErrorHandler("Error streaming file", 500));
    });

  } catch (error: any) {
    console.error('Error downloading delivery file:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get delivery files list (buyer only)
export const getDeliveryFiles = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true,
      orderStatus: { $in: ['delivered', 'completed', 'revision_requested'] }
    }).select('deliveryFiles deliveryMessage deliveryDate revisionRequest');

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to access delivery files", 404));
    }

    res.status(200).json({
      success: true,
      deliveryFiles: order.deliveryFiles || [],
      deliveryMessage: order.deliveryMessage,
      deliveryDate: order.deliveryDate,
      revisionFiles: order.revisionRequest?.revisionFiles || []
    });

  } catch (error: any) {
    console.error('Error fetching delivery files:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Request revision (buyer only)
export const requestRevision = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { revisionReason, revisionDetails, requestedChanges } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true,
      orderStatus: { $in: ['delivered', 'revision_requested'] }
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to request revision", 404));
    }

    // Debug logging
    console.log('🔍 Revision Request Debug:');
    console.log('Order ID:', orderId);
    console.log('Order Status:', order.orderStatus);
    console.log('Revision Count:', order.revisionCount);
    console.log('Max Revisions:', order.maxRevisions);
    console.log('Existing Revision Request:', order.revisionRequest);

    // Check if revision is allowed
    if (order.revisionCount >= order.maxRevisions) {
      return next(new ErrorHandler(`Maximum revisions (${order.maxRevisions}) have been reached`, 400));
    }

    // Handle existing revision requests
    if (order.revisionRequest) {
      if (order.revisionRequest.status === 'pending') {
        // Check if this is a stale/incomplete revision request
        if (order.orderStatus === 'delivered' && 
            (!order.revisionRequest.requestedChanges || order.revisionRequest.requestedChanges.length === 0)) {
          console.log('🔄 Clearing stale/incomplete revision request to allow new one');
          // Clear the stale revision request first
          await MarketplaceOrderModel.findByIdAndUpdate(orderId, {
            $unset: { revisionRequest: 1 }
          });
          // Refresh the order data
          const refreshedOrder = await MarketplaceOrderModel.findById(orderId);
          order.revisionRequest = undefined;
        } else {
          return next(new ErrorHandler("You already have a pending revision request", 400));
        }
      } else if (order.revisionRequest.status === 'in_progress') {
        return next(new ErrorHandler("Seller is currently working on your revision request", 400));
      } else if (['completed', 'rejected'].includes(order.revisionRequest.status) && order.orderStatus === 'delivered') {
        console.log('🔄 Clearing old completed/rejected revision request to allow new one');
        // Clear the old revision request
        await MarketplaceOrderModel.findByIdAndUpdate(orderId, {
          $unset: { revisionRequest: 1 }
        });
        order.revisionRequest = undefined;
      } else {
        return next(new ErrorHandler("Cannot request revision at this time", 400));
      }
    }

    // Create revision request
    const revisionRequest = {
      requestedAt: new Date(),
      requestedBy: userId,
      revisionReason: revisionReason.trim(),
      revisionDetails: revisionDetails.trim(),
      requestedChanges: requestedChanges.filter((change: string) => change.trim()),
      status: 'pending'
    };

    // Update order with revision request
    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'revision_requested',
        revisionRequest,
        revisionCount: order.revisionCount + 1,
        $push: {
          statusHistory: {
            status: 'revision_requested',
            timestamp: new Date(),
            note: `Revision requested: ${revisionReason}`
          }
        }
      },
      { new: true }
    ).populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    res.status(200).json({
      success: true,
      message: "Revision request sent successfully",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error requesting revision:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

// Respond to revision (seller only)
// Accept delivery (buyer only)
export const acceptDelivery = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      buyerId: userId,
      isActive: true,
      orderStatus: { $in: ['delivered', 'revision_requested'] }
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to accept this delivery", 404));
    }

    // Check if order can be accepted
    if (!['delivered', 'revision_requested'].includes(order.orderStatus)) {
      return next(new ErrorHandler(`Cannot accept delivery with status: ${order.orderStatus}`, 400));
    }

    // Release escrow if payment was via escrow
    let escrowReleaseSignature = null;
    
    // Check if order has escrow account (more lenient check)
    const hasEscrow = order.paymentDetails?.escrowAccount || order.escrowAccount;
    const isEscrowPayment = order.paymentMethod === 'escrow' || hasEscrow;
    
    console.log('🔍 Escrow check:', {
      hasEscrowAccount: !!order.paymentDetails?.escrowAccount,
      hasEscrowAccountField: !!order.escrowAccount,
      paymentMethod: order.paymentMethod,
      isEscrowPayment,
      orderId: order._id
    });
    
    if (hasEscrow && isEscrowPayment) {
      try {
        console.log('🔄 Attempting to release escrow...');
        const { releaseEscrow } = require("../../utils/escrowContract");
        
        // Get buyer and seller wallet addresses
        const buyerUser = await UserModel.findById(order.buyerId).select('walletAddress');
        const sellerUser = await MarketplaceSellerModel
          .findById(order.sellerId)
          .populate('userId', 'walletAddress')
          .select('userId');
        
        console.log('👤 Wallet addresses:', {
          buyerWallet: buyerUser?.walletAddress,
          sellerWallet: sellerUser?.userId?.walletAddress,
          hasBuyer: !!buyerUser?.walletAddress,
          hasSeller: !!sellerUser?.userId?.walletAddress
        });
        
        if (buyerUser?.walletAddress && sellerUser?.userId?.walletAddress) {
          const buyerWallet = new PublicKey(buyerUser.walletAddress);
          const sellerWallet = new PublicKey(sellerUser.userId.walletAddress);
          
          // Get offer ID from order (required for PDA derivation)
          if (!order.offerId) {
            throw new Error("Order missing offerId - cannot release escrow");
          }
          const offerId = order.offerId.toString();
          
          console.log('📤 Calling releaseEscrow with offerId:', offerId);
          const result = await releaseEscrow(buyerWallet, sellerWallet, offerId);
          escrowReleaseSignature = result.signature;
          
          console.log('✅ Escrow released successfully:', escrowReleaseSignature);
        } else {
          console.error('❌ Missing wallet addresses:', {
            buyerWallet: buyerUser?.walletAddress,
            sellerWallet: sellerUser?.userId?.walletAddress
          });
        }
      } catch (error: any) {
        console.error('❌ Error releasing escrow:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        // Don't fail the order completion if escrow release fails
        // But log the error clearly so we can debug
        // Admin can manually release later
      }
    } else {
      console.log('⚠️  Escrow not released - conditions not met:', {
        hasEscrow,
        isEscrowPayment,
        paymentMethod: order.paymentMethod
      });
    }

    // Update order status to completed
    const updateData: any = {
      orderStatus: 'completed',
      completedAt: new Date(),
      paymentStatus: 'completed', // Release payment to seller
      $push: {
        statusHistory: {
          status: 'completed',
          timestamp: new Date(),
          note: escrowReleaseSignature 
            ? 'Delivery accepted by buyer. Escrow released (95% seller, 5% admin).'
            : 'Delivery accepted by buyer'
        }
      }
    };

    // Add escrow release signature if available
    if (escrowReleaseSignature && order.paymentDetails) {
      updateData['paymentDetails.escrowReleaseSignature'] = escrowReleaseSignature;
      updateData['paymentDetails.sellerAmount'] = order.orderTotal * 0.95; // 95% to seller
      updateData['paymentDetails.adminAmount'] = order.orderTotal * 0.05; // 5% to admin
    }

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate([
      { path: 'buyerId', select: 'firstName lastName email walletAddress' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    // Update seller stats when order is completed
    if (updatedOrder && updatedOrder.sellerId) {
      console.log('🎯 Order completed - updating seller stats');
      await updateSellerStatsAfterOrder(updatedOrder.sellerId._id, updatedOrder.items, updatedOrder.orderTotal);
    }

    res.status(200).json({
      success: true,
      message: "Delivery accepted successfully",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error accepting delivery:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});

export const respondToRevision = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    const { responseMessage, action } = req.body; // action: 'accept' or 'reject'

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the seller profile
    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return next(new ErrorHandler("Seller profile not found", 404));
    }

    // Find the order
    const order = await MarketplaceOrderModel.findOne({
      _id: orderId,
      sellerId: seller._id,
      isActive: true,
      orderStatus: 'revision_requested'
    });

    if (!order) {
      return next(new ErrorHandler("Order not found or you don't have permission to respond to this revision", 404));
    }

    // Check if there's a pending revision request
    if (!order.revisionRequest || order.revisionRequest.status !== 'pending') {
      return next(new ErrorHandler("No pending revision request found", 400));
    }

    let updateData: any = {
      'revisionRequest.respondedAt': new Date(),
      'revisionRequest.responseMessage': responseMessage?.trim() || ''
    };

    // Handle file uploads for accepted revisions
    const revisionFiles = [];
    if (req.files && Array.isArray(req.files) && action === 'accept') {
      for (const file of req.files) {
        revisionFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          fileUrl: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });
      }
      updateData['revisionRequest.revisionFiles'] = revisionFiles;
    }

    if (action === 'accept') {
      updateData['revisionRequest.status'] = 'completed';
      updateData.orderStatus = 'delivered';
      updateData.$push = {
        statusHistory: {
          status: 'delivered',
          timestamp: new Date(),
          note: 'Revision completed and order re-delivered'
        }
      };
    } else if (action === 'reject') {
      updateData['revisionRequest.status'] = 'rejected';
      updateData.$push = {
        statusHistory: {
          status: 'revision_requested',
          timestamp: new Date(),
          note: 'Revision request rejected by seller'
        }
      };
    }

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate([
      { path: 'buyerId', select: 'firstName lastName email' },
      { path: 'sellerId', select: 'userId sellerName storeName storeLogo email' }
    ]);

    res.status(200).json({
      success: true,
      message: `Revision request ${action}ed successfully`,
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error responding to revision:', error);
    return next(new ErrorHandler(error.message, 500));
  }
});
