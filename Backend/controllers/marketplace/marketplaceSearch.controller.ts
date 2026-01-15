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

    // Build query - show approved and active items
    const query: any = { 
      isApproved: true,
      isActive: true
    };

    // Add search functionality
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
      console.log('Search filter applied:', searchTerm);
    }

    // Add category filter
    if (categories && typeof categories === 'string' && categories.trim()) {
      const categoryArray = (categories as string)
        .split(',')
        .map(cat => cat.trim())
        .filter(Boolean);
      
      if (categoryArray.length > 0) {
        query.category = { $in: categoryArray };
        console.log('Category filter applied:', categoryArray);
      }
    }

    // Determine model first to set correct sort fields
    let Model, items, totalItems;

    if (type === 'products') {
      Model = MarketplaceProductModel;
    } else {
      Model = MarketplaceServiceModel;
    }

    // Build sort options based on type
    let sortOptions: any = {};
    switch (sortBy) {
      case 'newest':
        sortOptions.createdAt = -1;
        sortOptions._id = -1; // Secondary sort for consistency
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        sortOptions._id = 1; // Secondary sort for consistency
        break;
      case 'price-low':
        if (type === 'products') {
          sortOptions.price = 1;
        } else {
          // For services, sort by minimum package price
          sortOptions['packages.price'] = 1;
        }
        sortOptions.createdAt = -1; // Secondary sort for consistency
        break;
      case 'price-high':
        if (type === 'products') {
          sortOptions.price = -1;
        } else {
          // For services, sort by maximum package price
          sortOptions['packages.price'] = -1;
        }
        sortOptions.createdAt = -1; // Secondary sort for consistency
        break;
      case 'popular':
        if (type === 'products') {
          sortOptions.salesCount = -1;
        } else {
          sortOptions.orderCount = -1; // Services use orderCount
        }
        sortOptions.createdAt = -1; // Secondary sort for consistency
        break;
      case 'rating':
        sortOptions.rating = -1;
        sortOptions.createdAt = -1; // Secondary sort for consistency
        break;
      default:
        sortOptions.createdAt = -1;
        sortOptions._id = -1; // Secondary sort for consistency
    }

    // Log the final query for debugging
    console.log('Marketplace search query:', JSON.stringify(query, null, 2));
    console.log('Search type:', type);
    console.log('Sort options:', sortOptions);
    console.log('Pagination:', { page: pageNum, limit: limitNum, skip });

    // Execute query with pagination
    // Note: .select('-fileUrl -previewUrl') excludes only those fields, all other fields including thumbnailImage and images are included by default
    const [itemsResult, totalItemsResult] = await Promise.all([
      Model.find(query)
        .select('-fileUrl -previewUrl') // Exclude sensitive fields for products, but include thumbnailImage and images
        .populate('sellerId', 'sellerName storeName storeLogo rating reviewCount')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(), // Use lean() for better performance
      Model.countDocuments(query)
    ]);

    items = itemsResult;
    totalItems = totalItemsResult;

    console.log(`Found ${totalItems} total items, returning ${items.length} items`);

    // Get marketplace stats
    const [totalProducts, totalServices, totalSellers] = await Promise.all([
      MarketplaceProductModel.countDocuments({ isApproved: true, isActive: true }),
      MarketplaceServiceModel.countDocuments({ isApproved: true, isActive: true }),
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
      MarketplaceProductModel.countDocuments({ isApproved: true, isActive: true }),
      MarketplaceServiceModel.countDocuments({ isApproved: true, isActive: true }),
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
      { $match: { isApproved: true, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get service counts by category
    const serviceCategories = await MarketplaceServiceModel.aggregate([
      { $match: { isApproved: true, isActive: true } },
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
