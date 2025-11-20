import { Request, Response } from "express";
import UserModel from "../../models/user.mode";
import { CourseModel } from "../../models/course.model";
import { MarketplaceProductModel } from "../../models/marketplace/MarketplaceProduct.model";
import { MarketplaceServiceModel } from "../../models/marketplace/MarketplaceService.model";
import { MarketplaceSellerModel } from "../../models/marketplace/MarketplaceSeller.model";
import { MarketplaceOrderModel } from "../../models/marketplace/MarketplaceOrder.model";
import { OrderModel } from "../../models/order.model";
import { ReviewModel } from "../../models/review.model";

// Get total users count
export const getTotalUsers = async (req: Request, res: Response) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthUsers = await UserModel.countDocuments({
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthUsers > 0 
      ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(0)
      : "0";

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total users:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total users"
    });
  }
};

// Get total instructors count
export const getTotalInstructors = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total instructors...");
    const totalInstructors = await UserModel.countDocuments({ 
      role: "instructor" 
    });
    console.log("Total instructors found:", totalInstructors);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthInstructors = await UserModel.countDocuments({
      role: "instructor",
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthInstructors > 0 
      ? ((totalInstructors - lastMonthInstructors) / lastMonthInstructors * 100).toFixed(0)
      : totalInstructors > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalInstructors,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total instructors:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total instructors",
      error: error.toString()
    });
  }
};

// Get total courses count
export const getTotalCourses = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total courses...");
    const totalCourses = await CourseModel.countDocuments();
    console.log("Total courses found:", totalCourses);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthCourses = await CourseModel.countDocuments({
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthCourses > 0 
      ? ((totalCourses - lastMonthCourses) / lastMonthCourses * 100).toFixed(0)
      : totalCourses > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total courses",
      error: error.toString()
    });
  }
};

// Get total products count
export const getTotalProducts = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total products...");
    const totalProducts = await MarketplaceProductModel.countDocuments({ 
      isApproved: true, 
      isActive: true 
    });
    console.log("Total products found:", totalProducts);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthProducts = await MarketplaceProductModel.countDocuments({
      isApproved: true,
      isActive: true,
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthProducts > 0 
      ? ((totalProducts - lastMonthProducts) / lastMonthProducts * 100).toFixed(0)
      : totalProducts > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total products:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total products",
      error: error.toString()
    });
  }
};

// Get total services count
export const getTotalServices = async (req: Request, res: Response) => {
  try {
    console.log("Fetching total services...");
    const totalServices = await MarketplaceServiceModel.countDocuments({ 
      isApproved: true, 
      isActive: true 
    });
    console.log("Total services found:", totalServices);
    
    // Calculate growth from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthServices = await MarketplaceServiceModel.countDocuments({
      isApproved: true,
      isActive: true,
      createdAt: { $lt: lastMonth }
    });
    const growth = lastMonthServices > 0 
      ? ((totalServices - lastMonthServices) / lastMonthServices * 100).toFixed(0)
      : totalServices > 0 ? "100" : "0";

    res.status(200).json({
      success: true,
      data: {
        totalServices,
        growth: `+${growth}%`,
        change: `+${growth}%`
      }
    });
  } catch (error: any) {
    console.error("Error fetching total services:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch total services",
      error: error.toString()
    });
  }
};

// Get average rating across courses, products, and services
export const getAvgRating = async (req: Request, res: Response) => {
  try {
    // Get average ratings
    const courseRatings = await CourseModel.aggregate([
      { $match: { averageRating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$averageRating" } } }
    ]);

    const productRatings = await MarketplaceProductModel.aggregate([
      { $match: { isApproved: true, isActive: true, rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    const serviceRatings = await MarketplaceServiceModel.aggregate([
      { $match: { isApproved: true, isActive: true, rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    const ratings = [
      courseRatings[0]?.avgRating || 0,
      productRatings[0]?.avgRating || 0,
      serviceRatings[0]?.avgRating || 0
    ].filter(r => r > 0);

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
      : "0.0";

    res.status(200).json({
      success: true,
      data: {
        avgRating: parseFloat(avgRating),
        growth: "+0.1",
        change: "+0.1"
      }
    });
  } catch (error: any) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch average rating"
    });
  }
};

// Get top instructors
export const getTopInstructors = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get all instructors with their course stats
    const instructors = await UserModel.find({ role: "instructor" })
      .select("firstName lastName username avatar isVerified")
      .limit(limit);

    // Get course stats for each instructor
    const instructorsWithStats = await Promise.all(
      instructors.map(async (instructor) => {
        const courses = await CourseModel.find({ createdBy: instructor._id });
        const courseIds = courses.map(c => c._id.toString());

        // Calculate total students from orders
        const totalStudents = await OrderModel.countDocuments({
          courseId: { $in: courseIds },
          status: "completed"
        });

        // Calculate average rating from reviews
        const reviews = await ReviewModel.find({
          courseId: { $in: courseIds }
        });
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        // Calculate total revenue
        const orders = await OrderModel.find({
          courseId: { $in: courseIds },
          status: "completed"
        });
        const totalRevenue = orders.reduce((sum, o) => sum + (o.coursePrice || 0), 0);

        return {
          id: instructor._id.toString(),
          name: `${instructor.firstName} ${instructor.lastName}`,
          username: instructor.username,
          avatar: instructor.avatar || `https://ui-avatars.com/api/?name=${instructor.firstName}+${instructor.lastName}&background=random`,
          rating: avgRating.toFixed(1),
          students: totalStudents,
          courses: courses.length,
          revenue: totalRevenue,
          verified: instructor.isVerified || false,
          badge: avgRating >= 4.8 ? "Top Rated" : avgRating >= 4.5 ? "Expert" : "Instructor",
          level: avgRating >= 4.8 ? "Pro" : avgRating >= 4.5 ? "Level 2" : "Level 1"
        };
      })
    );

    // Sort by students enrolled (popularity) and limit
    const topInstructors = instructorsWithStats
      .sort((a, b) => b.students - a.students)
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        instructors: topInstructors
      }
    });
  } catch (error: any) {
    console.error("Error fetching top instructors:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top instructors"
    });
  }
};

// Get top products
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topProducts = await MarketplaceProductModel.find({
      isApproved: true,
      isActive: true
    })
      .select("-fileUrl -previewUrl")
      .populate("sellerId", "sellerName storeName storeLogo")
      .sort({ salesCount: -1, rating: -1 })
      .limit(limit);

    const formattedProducts = topProducts.map((product) => ({
      id: product._id.toString(),
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      image: product.images?.[0] || product.thumbnailImage || "https://via.placeholder.com/300x200",
      badge: product.salesCount >= 1000 ? "Best Seller" : product.salesCount >= 500 ? "Hot" : "New",
      category: product.category,
      downloads: product.salesCount || 0,
      seller: product.sellerId?.sellerName || product.sellerId?.storeName || "Unknown",
      fileFormat: product.fileFormat || "N/A",
      license: product.license || "Standard"
    }));

    res.status(200).json({
      success: true,
      data: {
        products: formattedProducts
      }
    });
  } catch (error: any) {
    console.error("Error fetching top products:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top products"
    });
  }
};

// Get top services
export const getTopServices = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topServices = await MarketplaceServiceModel.find({
      isApproved: true,
      isActive: true
    })
      .populate("sellerId", "sellerName storeName storeLogo sellerLevel")
      .sort({ orderCount: -1, rating: -1 })
      .limit(limit);

    const formattedServices = topServices.map((service) => {
      const minPrice = service.packages && service.packages.length > 0
        ? Math.min(...service.packages.map((p: any) => p.price || 0))
        : 0;

      return {
        id: service._id.toString(),
        title: service.title,
        price: minPrice,
        rating: service.rating || 0,
        reviewCount: service.reviewCount || 0,
        image: service.images?.[0] || service.thumbnailImage || "https://via.placeholder.com/300x200",
        seller: service.sellerId?.sellerName || service.sellerId?.storeName || "Unknown",
        deliveryTime: service.deliveryTime || "N/A",
        badge: service.orderCount >= 500 ? "Best Seller" : service.orderCount >= 200 ? "Top Rated" : service.orderCount >= 100 ? "Pro" : "Popular",
        category: service.category,
        orders: service.orderCount || 0,
        revisions: service.revisions || "Unlimited",
        level: service.sellerId?.sellerLevel || "Level 1"
      };
    });

    res.status(200).json({
      success: true,
      data: {
        services: formattedServices
      }
    });
  } catch (error: any) {
    console.error("Error fetching top services:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top services"
    });
  }
};

// Get top sellers
export const getTopSellers = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const topSellers = await MarketplaceSellerModel.find({
      isActive: true
    })
      .populate("userId", "firstName lastName username avatar")
      .sort({ totalEarnings: -1, totalSales: -1 })
      .limit(limit);

    const formattedSellers = await Promise.all(
      topSellers.map(async (seller) => {
        const productCount = await MarketplaceProductModel.countDocuments({
          sellerId: seller._id,
          isApproved: true,
          isActive: true
        });

        const serviceCount = await MarketplaceServiceModel.countDocuments({
          sellerId: seller._id,
          isApproved: true,
          isActive: true
        });

        return {
          id: seller._id.toString(),
          name: seller.storeName || seller.sellerName || "Unknown Seller",
          avatar: seller.storeLogo || seller.userId?.avatar || "https://ui-avatars.com/api/?name=" + seller.storeName,
          rating: seller.rating || 0,
          totalSales: seller.totalSales || 0,
          products: productCount,
          services: serviceCount,
          earnings: `$${((seller.totalEarnings || 0) / 1000).toFixed(0)}K`,
          joinDate: seller.joinedDate || seller.createdAt,
          verified: seller.verified || false,
          level: seller.sellerLevel || "New Seller",
          badge: seller.totalSales >= 5000 ? "Top Seller" : seller.totalSales >= 2000 ? "Expert" : seller.totalSales >= 500 ? "Rising Star" : "Seller"
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        sellers: formattedSellers
      }
    });
  } catch (error: any) {
    console.error("Error fetching top sellers:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch top sellers"
    });
  }
};

// Get trending categories
export const getTrendingCategories = async (req: Request, res: Response) => {
  try {
    // Get course categories
    const courseCategories = await CourseModel.aggregate([
      { $match: {} },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get product categories
    const productCategories = await MarketplaceProductModel.aggregate([
      { $match: { isApproved: true, isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get service categories
    const serviceCategories = await MarketplaceServiceModel.aggregate([
      { $match: { isApproved: true, isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Combine and format
    const categoryMap = new Map();
    
    courseCategories.forEach((cat) => {
      if (cat._id) {
        const existing = categoryMap.get(cat._id) || 0;
        categoryMap.set(cat._id, existing + cat.count);
      }
    });

    productCategories.forEach((cat) => {
      if (cat._id) {
        const existing = categoryMap.get(cat._id) || 0;
        categoryMap.set(cat._id, existing + cat.count);
      }
    });

    serviceCategories.forEach((cat) => {
      if (cat._id) {
        const existing = categoryMap.get(cat._id) || 0;
        categoryMap.set(cat._id, existing + cat.count);
      }
    });

    // Convert to array and sort
    const trendingCategories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.status(200).json({
      success: true,
      data: {
        categories: trendingCategories
      }
    });
  } catch (error: any) {
    console.error("Error fetching trending categories:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch trending categories"
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent course enrollments (orders)
    const recentOrders = await OrderModel.find({
      status: "completed"
    })
      .populate("userId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent product purchases
    const recentProductOrders = await MarketplaceOrderModel.find({
      paymentStatus: "completed",
      "items.itemType": "product"
    })
      .populate("buyerId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent service orders
    const recentServiceOrders = await MarketplaceOrderModel.find({
      paymentStatus: "completed",
      "items.itemType": "service"
    })
      .populate("buyerId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent reviews
    const recentReviews = await ReviewModel.find()
      .populate("userId", "firstName lastName username")
      .sort({ createdAt: -1 })
      .limit(5);

    // Format activities
    const activities = [];

    recentOrders.forEach((order) => {
      activities.push({
        id: `order-${order._id}`,
        type: "course_completed",
        user: `${order.userId?.firstName || ""} ${order.userId?.lastName || ""}`.trim() || order.userId?.username || "User",
        action: "completed",
        item: order.courseName || "Course",
        time: formatTimeAgo(order.createdAt),
        icon: "CheckCircle",
        color: "text-slate-400"
      });
    });

    recentProductOrders.forEach((order) => {
      activities.push({
        id: `product-${order._id}`,
        type: "product_purchased",
        user: `${order.buyerId?.firstName || ""} ${order.buyerId?.lastName || ""}`.trim() || order.buyerId?.username || "User",
        action: "purchased",
        item: order.items[0]?.itemTitle || "Product",
        time: formatTimeAgo(order.createdAt),
        icon: "ShoppingCart",
        color: "text-slate-400"
      });
    });

    recentServiceOrders.forEach((order) => {
      activities.push({
        id: `service-${order._id}`,
        type: "service_ordered",
        user: `${order.buyerId?.firstName || ""} ${order.buyerId?.lastName || ""}`.trim() || order.buyerId?.username || "User",
        action: "ordered",
        item: order.items[0]?.itemTitle || "Service",
        time: formatTimeAgo(order.createdAt),
        icon: "Briefcase",
        color: "text-slate-400"
      });
    });

    recentReviews.forEach((review) => {
      activities.push({
        id: `review-${review._id}`,
        type: "review_added",
        user: `${review.userId?.firstName || ""} ${review.userId?.lastName || ""}`.trim() || review.userId?.username || "User",
        action: "reviewed",
        item: review.courseId ? "Course" : "Item",
        time: formatTimeAgo(review.createdAt),
        icon: "Star",
        color: "text-slate-400"
      });
    });

    // Sort by timestamp (most recent first) and limit
    const sortedActivities = activities
      .sort((a, b) => {
        // Extract minutes/hours/days from time string for sorting
        const getTimeValue = (timeStr: string): number => {
          if (timeStr.includes("seconds")) return 1;
          if (timeStr.includes("minutes")) {
            const mins = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 100 + mins;
          }
          if (timeStr.includes("hours")) {
            const hours = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 10000 + hours;
          }
          if (timeStr.includes("days")) {
            const days = parseInt(timeStr.match(/\d+/)?.[0] || "0");
            return 1000000 + days;
          }
          return 100000000;
        };
        return getTimeValue(b.time) - getTimeValue(a.time);
      })
      .slice(0, limit);

    res.status(200).json({
      success: true,
      data: {
        activities: sortedActivities
      }
    });
  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recent activity"
    });
  }
};

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

