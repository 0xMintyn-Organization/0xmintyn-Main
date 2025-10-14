import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../../middleware/catchAsyncError";
import ErrorHandler from "../../utils/errorHandler";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import UserModel from "../../models/user.mode";

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

    // Create the order
    const orderData = {
      buyerId: userId,
      sellerId,
      items: orderItems,
      orderTotal: totalAmount,
      currency: 'USD',
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
          ...(orderItems.some(item => item.itemType === 'product') && {
            purchasedProducts: { $each: orderItems.filter(item => item.itemType === 'product').map(item => ({ productId: item.itemId.toString() })) }
          }),
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

// Cancel order
export const cancelOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
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
    const canBeCancelled = ['pending', 'confirmed'].includes(order.orderStatus) && 
                          ['pending', 'completed'].includes(order.paymentStatus);
    
    if (!canBeCancelled) {
      return next(new ErrorHandler("Order cannot be cancelled at this stage", 400));
    }

    const updatedOrder = await MarketplaceOrderModel.findByIdAndUpdate(
      orderId,
      { 
        orderStatus: 'cancelled',
        paymentStatus: 'cancelled'
      },
      { new: true, runValidators: true }
    )
      .populate('buyerId', 'name email')
      .populate('sellerId', 'sellerName storeName storeLogo email');

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder
    });

  } catch (error: any) {
    console.error('Error cancelling order:', error);
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
