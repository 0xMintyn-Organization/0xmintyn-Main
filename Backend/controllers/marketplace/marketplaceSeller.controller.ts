import { Request, Response } from "express";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import UserModel from "../../models/user.mode";
import { CatchAsyncError } from "../../middleware/catchAsyncError";

// Create marketplace seller profile
export const createMarketplaceSeller = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Check if user already has a seller profile
    const existingSeller = await MarketplaceSellerModel.findOne({ userId });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: "Seller profile already exists"
      });
    }

    // Check if store name is already taken
    if (req.body.storeName) {
      const existingStore = await MarketplaceSellerModel.findOne({ 
        storeName: req.body.storeName 
      });
      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: "Store name already taken"
        });
      }
    }

    const sellerData = {
      userId,
      sellerName: req.body.sellerName,
      storeName: req.body.storeName,
      storeDescription: req.body.storeDescription,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      businessType: req.body.businessType || 'Individual',
      sellerType: req.body.sellerType || 'both', // Add seller type
      businessAddress: {
        street: req.body.businessAddress?.street || '',
        city: req.body.businessAddress?.city || '',
        state: req.body.businessAddress?.state || '',
        country: req.body.businessAddress?.country,
        zipCode: req.body.businessAddress?.zipCode || ''
      },
      taxId: req.body.taxId || '',
      paymentDetails: {
        paypalEmail: req.body.paymentDetails?.paypalEmail || '',
        bankAccountNumber: req.body.paymentDetails?.bankAccountNumber || '',
        bankName: req.body.paymentDetails?.bankName || '',
        bankIFSC: req.body.paymentDetails?.bankIFSC || '',
        upiId: req.body.paymentDetails?.upiId || ''
      },
      storeLogo: req.body.storeLogo || 'https://via.placeholder.com/150',
      storeBanner: req.body.storeBanner || 'https://via.placeholder.com/1200x300'
    };

    const seller = await MarketplaceSellerModel.create(sellerData);

    // Update user's isSeller status
    await UserModel.findByIdAndUpdate(userId, { isSeller: true });

    res.status(201).json({
      success: true,
      message: "Seller profile created successfully",
      seller
    });

  } catch (error: any) {
    console.error("Error creating seller profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create seller profile"
    });
  }
};

// Get seller profile
export const getMarketplaceSeller = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    console.log('Getting seller profile for user ID:', userId);
    console.log('User object:', req.user);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const seller = await MarketplaceSellerModel.findOne({ userId })
      .populate('userId', 'name email avatar');
    
    console.log('Found seller:', seller ? 'Yes' : 'No');

    if (!seller) {
      console.log('No seller profile found for user ID:', userId);
      return res.status(404).json({
        success: false,
        message: "Seller profile not found"
      });
    }

    console.log('Seller profile data:', {
      rating: seller.rating,
      reviewCount: seller.reviewCount,
      totalEarnings: seller.totalEarnings,
      totalSales: seller.totalSales
    });

    res.status(200).json({
      success: true,
      seller
    });

  } catch (error: any) {
    console.error("Error fetching seller profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch seller profile"
    });
  }
};

// Update seller profile
export const updateMarketplaceSeller = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found"
      });
    }

    // Check if store name is being changed and if it's already taken
    if (req.body.storeName && req.body.storeName !== seller.storeName) {
      const existingStore = await MarketplaceSellerModel.findOne({ 
        storeName: req.body.storeName,
        _id: { $ne: seller._id }
      });
      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: "Store name already taken"
        });
      }
    }

    const updateData = {
      ...req.body,
      businessAddress: {
        ...seller.businessAddress,
        ...req.body.businessAddress
      },
      paymentDetails: {
        ...seller.paymentDetails,
        ...req.body.paymentDetails
      }
    };

    const updatedSeller = await MarketplaceSellerModel.findByIdAndUpdate(
      seller._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Seller profile updated successfully",
      seller: updatedSeller
    });

  } catch (error: any) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update seller profile"
    });
  }
};

// Check if user needs to create seller profile
export const checkSellerProfileStatus = CatchAsyncError(async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const seller = await MarketplaceSellerModel.findOne({ userId });
    
    res.status(200).json({
      success: true,
      hasProfile: !!seller,
      needsProfile: !seller,
      userId: userId
    });

  } catch (error: any) {
    console.error("Error checking seller profile status:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete seller profile
export const deleteMarketplaceSeller = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const seller = await MarketplaceSellerModel.findOne({ userId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found"
      });
    }

    await MarketplaceSellerModel.findByIdAndDelete(seller._id);

    // Update user's isSeller status
    await UserModel.findByIdAndUpdate(userId, { isSeller: false });

    res.status(200).json({
      success: true,
      message: "Seller profile deleted successfully"
    });

  } catch (error: any) {
    console.error("Error deleting seller profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete seller profile"
    });
  }
};

// Get all sellers (public)
export const getAllMarketplaceSellers = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      businessType,
      sellerLevel,
      verified,
      sortBy = 'joinedDate',
      sortOrder = 'desc'
    } = req.query;

    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { sellerName: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } },
        { storeDescription: { $regex: search, $options: 'i' } }
      ];
    }

    if (businessType) {
      query.businessType = businessType;
    }

    if (sellerLevel) {
      query.sellerLevel = sellerLevel;
    }

    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const sellers = await MarketplaceSellerModel.find(query)
      .populate('userId', 'name email avatar')
      .sort(sortOptions)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await MarketplaceSellerModel.countDocuments(query);

    res.status(200).json({
      success: true,
      sellers,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });

  } catch (error: any) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sellers"
    });
  }
};

// Get seller by ID (public)
export const getMarketplaceSellerById = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const seller = await MarketplaceSellerModel.findById(sellerId)
      .populate('userId', 'name email avatar');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found"
      });
    }

    res.status(200).json({
      success: true,
      seller
    });

  } catch (error: any) {
    console.error("Error fetching seller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch seller"
    });
  }
};
