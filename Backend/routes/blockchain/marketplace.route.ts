import express from 'express';
import { isAuthenticated } from '../../middleware/authWithRefresh';
import { catchAsyncError } from '../../middleware/catchAsyncError';
import { solanaClientManager } from '../../services/solana/solana-client-manager.service';
import { cacheService } from '../../services/cache/redis-cache.service';
import { 
  MarketplaceListing, 
  MarketplaceSale,
  UserActivity,
  MarketplaceModelUtils 
} from '../../models/blockchain/marketplace.model';
import { PublicKey, Keypair } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

const marketplaceRouter = express.Router();

// GET /api/v1/marketplace/listings - Get marketplace listings
marketplaceRouter.get('/listings', catchAsyncError(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    minPrice, 
    maxPrice, 
    seller, 
    search, 
    sort = 'newest' 
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  
  const result = await MarketplaceModelUtils.searchListings(
    search as string || '',
    {
      category: category as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string,
      seller: seller as string
    },
    sort as 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular',
    Number(limit),
    skip
  );
  
  res.status(200).json({
    success: true,
    data: {
      listings: result.listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        hasMore: result.hasMore
      }
    }
  });
}));

// GET /api/v1/marketplace/listings/active - Get active listings
marketplaceRouter.get('/listings/active', catchAsyncError(async (req, res) => {
  // Try cache first
  let activeListings = await cacheService.getActiveListings();
  
  if (!activeListings.length && solanaClientManager.marketplace) {
    const blockchainListings = await solanaClientManager.marketplace.getActiveListings();
    activeListings = blockchainListings;
    await cacheService.cacheActiveListings(blockchainListings);
  }
  
  // Also get from database for additional metadata
  const dbListings = await MarketplaceListing.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(50);
  
  res.status(200).json({
    success: true,
    data: {
      blockchain: activeListings,
      database: dbListings
    }
  });
}));

// GET /api/v1/marketplace/listings/trending - Get trending listings
marketplaceRouter.get('/listings/trending', catchAsyncError(async (req, res) => {
  const { limit = 20 } = req.query;
  
  const trending = await MarketplaceModelUtils.getTrendingListings(Number(limit));
  
  res.status(200).json({
    success: true,
    data: trending
  });
}));

// GET /api/v1/marketplace/listings/:id - Get specific listing
marketplaceRouter.get('/listings/:id', catchAsyncError(async (req, res) => {
  const { id } = req.params;
  
  // Try cache first
  let listing = await cacheService.getMarketplaceListing(id);
  
  if (!listing && solanaClientManager.marketplace) {
    try {
      listing = await solanaClientManager.marketplace.getListing(new PublicKey(id));
      if (listing) {
        await cacheService.cacheMarketplaceListing(id, listing);
      }
    } catch (error) {
      // Invalid public key or listing not found
    }
  }
  
  // Get from database for additional metadata
  const dbListing = await MarketplaceListing.findOne({ programAddress: id });
  
  if (!listing && !dbListing) {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      blockchain: listing,
      database: dbListing
    }
  });
}));

// GET /api/v1/marketplace/listings/seller/:publicKey - Get listings by seller
marketplaceRouter.get('/listings/seller/:publicKey', catchAsyncError(async (req, res) => {
  const { publicKey } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  if (!PublicKey.isOnCurve(publicKey)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid public key format'
    });
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  // Get from database
  const listings = await MarketplaceListing.find({ seller: publicKey })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await MarketplaceListing.countDocuments({ seller: publicKey });
  
  // Also get from blockchain if available
  let blockchainListings = [];
  if (solanaClientManager.marketplace) {
    blockchainListings = await solanaClientManager.marketplace.getListingsBySeller(
      new PublicKey(publicKey)
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      listings,
      blockchain: blockchainListings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + Number(limit) < total
      }
    }
  });
}));

// GET /api/v1/marketplace/listings/category/:category - Get listings by category
marketplaceRouter.get('/listings/category/:category', catchAsyncError(async (req, res) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  // Get from database
  const listings = await MarketplaceListing.find({ 
    category: { $regex: new RegExp(category, 'i') },
    isActive: true 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await MarketplaceListing.countDocuments({ 
    category: { $regex: new RegExp(category, 'i') },
    isActive: true 
  });
  
  // Also get from blockchain if available
  let blockchainListings = [];
  if (solanaClientManager.marketplace) {
    blockchainListings = await solanaClientManager.marketplace.getListingsByCategory(category);
  }
  
  res.status(200).json({
    success: true,
    data: {
      listings,
      blockchain: blockchainListings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + Number(limit) < total
      }
    }
  });
}));

// POST /api/v1/marketplace/listings - Create new listing
marketplaceRouter.post('/listings', isAuthenticated, catchAsyncError(async (req, res) => {
  const { 
    sellerPrivateKey, 
    nftMint, 
    price, 
    title, 
    description, 
    category 
  } = req.body;
  
  if (!sellerPrivateKey || !nftMint || !price || !title || !description || !category) {
    return res.status(400).json({
      success: false,
      message: 'All listing fields are required'
    });
  }
  
  if (!solanaClientManager.marketplace) {
    return res.status(503).json({
      success: false,
      message: 'Marketplace service not available'
    });
  }
  
  try {
    const sellerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(sellerPrivateKey)));
    const nftMintPubkey = new PublicKey(nftMint);
    
    const txHash = await solanaClientManager.marketplace.createListing({
      sellerKeypair,
      nftMint: nftMintPubkey,
      price: new BN(price),
      title,
      description,
      category
    });
    
    // Clear relevant caches
    await cacheService.del('marketplace:active_listings');
    await cacheService.del('marketplace:stats');
    
    // Record user activity
    await MarketplaceModelUtils.recordUserActivity(
      sellerKeypair.publicKey.toString(),
      'list',
      'new_listing',
      nftMint,
      { title, description, category, price }
    );
    
    res.status(200).json({
      success: true,
      data: { txHash },
      message: 'Listing created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// PUT /api/v1/marketplace/listings/:id - Update listing
marketplaceRouter.put('/listings/:id', isAuthenticated, catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const { sellerPrivateKey, newPrice, newTitle, newDescription } = req.body;
  
  if (!sellerPrivateKey) {
    return res.status(400).json({
      success: false,
      message: 'Seller private key is required'
    });
  }
  
  if (!solanaClientManager.marketplace) {
    return res.status(503).json({
      success: false,
      message: 'Marketplace service not available'
    });
  }
  
  try {
    const sellerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(sellerPrivateKey)));
    const listingPubkey = new PublicKey(id);
    
    const txHash = await solanaClientManager.marketplace.updateListing(
      sellerKeypair,
      listingPubkey,
      newPrice ? new BN(newPrice) : undefined,
      newTitle,
      newDescription
    );
    
    // Clear relevant caches
    await cacheService.del(`marketplace:listing:${id}`);
    await cacheService.del('marketplace:active_listings');
    
    // Record user activity
    await MarketplaceModelUtils.recordUserActivity(
      sellerKeypair.publicKey.toString(),
      'update',
      id,
      'unknown',
      { newPrice, newTitle, newDescription }
    );
    
    res.status(200).json({
      success: true,
      data: { txHash },
      message: 'Listing updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// DELETE /api/v1/marketplace/listings/:id - Cancel listing
marketplaceRouter.delete('/listings/:id', isAuthenticated, catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const { sellerPrivateKey } = req.body;
  
  if (!sellerPrivateKey) {
    return res.status(400).json({
      success: false,
      message: 'Seller private key is required'
    });
  }
  
  if (!solanaClientManager.marketplace) {
    return res.status(503).json({
      success: false,
      message: 'Marketplace service not available'
    });
  }
  
  try {
    const sellerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(sellerPrivateKey)));
    const listingPubkey = new PublicKey(id);
    
    const txHash = await solanaClientManager.marketplace.cancelListing(
      sellerKeypair,
      listingPubkey
    );
    
    // Clear relevant caches
    await cacheService.del(`marketplace:listing:${id}`);
    await cacheService.del('marketplace:active_listings');
    
    // Record user activity
    await MarketplaceModelUtils.recordUserActivity(
      sellerKeypair.publicKey.toString(),
      'cancel',
      id,
      'unknown',
      { reason: 'seller_cancelled' }
    );
    
    res.status(200).json({
      success: true,
      data: { txHash },
      message: 'Listing cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// POST /api/v1/marketplace/purchase - Purchase item
marketplaceRouter.post('/purchase', isAuthenticated, catchAsyncError(async (req, res) => {
  const { buyerPrivateKey, listing, paymentMint } = req.body;
  
  if (!buyerPrivateKey || !listing || !paymentMint) {
    return res.status(400).json({
      success: false,
      message: 'Buyer private key, listing, and payment mint are required'
    });
  }
  
  if (!solanaClientManager.marketplace) {
    return res.status(503).json({
      success: false,
      message: 'Marketplace service not available'
    });
  }
  
  try {
    const buyerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(buyerPrivateKey)));
    const listingPubkey = new PublicKey(listing);
    const paymentMintPubkey = new PublicKey(paymentMint);
    
    const txHash = await solanaClientManager.marketplace.purchaseItem({
      buyerKeypair,
      listing: listingPubkey,
      paymentMint: paymentMintPubkey
    });
    
    // Clear relevant caches
    await cacheService.del(`marketplace:listing:${listing}`);
    await cacheService.del('marketplace:active_listings');
    await cacheService.del('marketplace:stats');
    
    // Record user activity
    await MarketplaceModelUtils.recordUserActivity(
      buyerKeypair.publicKey.toString(),
      'purchase',
      listing,
      'unknown',
      { paymentMint }
    );
    
    res.status(200).json({
      success: true,
      data: { txHash },
      message: 'Item purchased successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// POST /api/v1/marketplace/view/:id - Record listing view
marketplaceRouter.post('/view/:id', catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');
  
  if (user) {
    await MarketplaceModelUtils.recordUserActivity(
      user,
      'view',
      id,
      'unknown',
      {},
      ipAddress,
      userAgent
    );
  }
  
  res.status(200).json({
    success: true,
    message: 'View recorded'
  });
}));

// POST /api/v1/marketplace/favorite/:id - Toggle favorite
marketplaceRouter.post('/favorite/:id', isAuthenticated, catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const { user } = req.body;
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User is required'
    });
  }
  
  await MarketplaceModelUtils.recordUserActivity(
    user,
    'favorite',
    id,
    'unknown',
    {}
  );
  
  res.status(200).json({
    success: true,
    message: 'Favorite toggled'
  });
}));

// GET /api/v1/marketplace/recommendations/:user - Get recommendations
marketplaceRouter.get('/recommendations/:user', catchAsyncError(async (req, res) => {
  const { user } = req.params;
  const { limit = 10 } = req.query;
  
  if (!PublicKey.isOnCurve(user)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user public key format'
    });
  }
  
  const recommendations = await MarketplaceModelUtils.getListingRecommendations(
    user,
    Number(limit)
  );
  
  res.status(200).json({
    success: true,
    data: recommendations
  });
}));

// GET /api/v1/marketplace/stats - Get marketplace statistics
marketplaceRouter.get('/stats', catchAsyncError(async (req, res) => {
  const { timeframe = 'day' } = req.query;
  
  // Try cache first
  let stats = await cacheService.getMarketplaceStats();
  
  if (!stats) {
    stats = await MarketplaceModelUtils.getMarketStats(
      timeframe as 'day' | 'week' | 'month'
    );
    await cacheService.cacheMarketplaceStats(stats);
  }
  
  res.status(200).json({
    success: true,
    data: stats
  });
}));

// GET /api/v1/marketplace/sales - Get sales history
marketplaceRouter.get('/sales', catchAsyncError(async (req, res) => {
  const { page = 1, limit = 20, seller, buyer, category } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  
  const query: any = {};
  if (seller) query.seller = seller;
  if (buyer) query.buyer = buyer;
  if (category) query.category = category;
  
  const sales = await MarketplaceSale.find(query)
    .sort({ blockTime: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await MarketplaceSale.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      sales,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + Number(limit) < total
      }
    }
  });
}));

// GET /api/v1/marketplace/user/:publicKey/stats - Get user marketplace stats
marketplaceRouter.get('/user/:publicKey/stats', catchAsyncError(async (req, res) => {
  const { publicKey } = req.params;
  
  if (!PublicKey.isOnCurve(publicKey)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid public key format'
    });
  }
  
  const stats = await MarketplaceModelUtils.getUserStats(publicKey);
  
  res.status(200).json({
    success: true,
    data: stats
  });
}));

// GET /api/v1/marketplace/user/:publicKey/activity - Get user activity
marketplaceRouter.get('/user/:publicKey/activity', catchAsyncError(async (req, res) => {
  const { publicKey } = req.params;
  const { page = 1, limit = 20, type } = req.query;
  
  if (!PublicKey.isOnCurve(publicKey)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid public key format'
    });
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  const query: any = { user: publicKey };
  
  if (type) {
    query.activityType = type;
  }
  
  const activities = await UserActivity.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(Number(limit));
  
  const total = await UserActivity.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: {
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + Number(limit) < total
      }
    }
  });
}));

export default marketplaceRouter;









