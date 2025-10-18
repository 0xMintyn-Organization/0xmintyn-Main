import { Request, Response } from "express";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";

// Search marketplace items with filters, pagination, and sorting
export const searchMarketplace = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      categories = '',
      sortBy = 'newest',
      type = 'products' // 'products' or 'services'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { 
      isApproved: true,
      approvalStatus: 'Approved'
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add category filter
    if (categories) {
      const categoryArray = (categories as string).split(',').filter(Boolean);
      if (categoryArray.length > 0) {
        query.category = { $in: categoryArray };
      }
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'popular':
        sortOptions.totalSales = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    let Model, items, totalItems;

    if (type === 'products') {
      Model = MarketplaceProductModel;
    } else {
      Model = MarketplaceServiceModel;
    }

    // Execute query with pagination
    const [itemsResult, totalItemsResult] = await Promise.all([
      Model.find(query)
        .select('-fileUrl -previewUrl') // Exclude sensitive fields for products
        .populate('sellerId', 'sellerName storeName storeLogo rating reviewCount')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Model.countDocuments(query)
    ]);

    items = itemsResult;
    totalItems = totalItemsResult;

    // Get marketplace stats
    const [totalProducts, totalServices, totalSellers] = await Promise.all([
      MarketplaceProductModel.countDocuments({ isApproved: true, approvalStatus: 'Approved' }),
      MarketplaceServiceModel.countDocuments({ isApproved: true, approvalStatus: 'Approved' }),
      MarketplaceSellerModel.countDocuments({ isActive: true })
    ]);

    // Calculate success rate (mock calculation)
    const successRate = 98;

    const totalPages = Math.ceil(totalItems / limitNum);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      },
      stats: {
        totalProducts,
        totalServices,
        totalSellers,
        successRate
      }
    });

  } catch (error: any) {
    console.error("Error searching marketplace:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search marketplace"
    });
  }
};

// Get marketplace statistics
export const getMarketplaceStats = async (req: Request, res: Response) => {
  try {
    const [totalProducts, totalServices, totalSellers] = await Promise.all([
      MarketplaceProductModel.countDocuments({ isApproved: true, approvalStatus: 'Approved' }),
      MarketplaceServiceModel.countDocuments({ isApproved: true, approvalStatus: 'Approved' }),
      MarketplaceSellerModel.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalServices,
        totalSellers,
        successRate: 98
      }
    });

  } catch (error: any) {
    console.error("Error fetching marketplace stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch marketplace stats"
    });
  }
};

// Get category statistics
export const getCategoryStats = async (req: Request, res: Response) => {
  try {
    // Get product counts by category
    const productCategories = await MarketplaceProductModel.aggregate([
      { $match: { isApproved: true, approvalStatus: 'Approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get service counts by category
    const serviceCategories = await MarketplaceServiceModel.aggregate([
      { $match: { isApproved: true, approvalStatus: 'Approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Convert to object format
    const productStats: Record<string, number> = {};
    const serviceStats: Record<string, number> = {};

    productCategories.forEach(item => {
      productStats[item._id] = item.count;
    });

    serviceCategories.forEach(item => {
      serviceStats[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      categoryStats: {
        products: productStats,
        services: serviceStats
      }
    });

  } catch (error: any) {
    console.error("Error fetching category stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category stats"
    });
  }
};
