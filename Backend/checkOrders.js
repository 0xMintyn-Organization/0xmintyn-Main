const mongoose = require('mongoose');
require('dotenv').config();

// Import models (using require since we're in a script)
const MarketplaceOrderModel = require('./models/marketplace/MarketplaceOrder.model').MarketplaceOrderModel;
const MarketplaceSellerModel = require('./models/marketplace/MarketplaceSeller.model').MarketplaceSellerModel;

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/0xmintyn');
    
    // Get all orders
    const orders = await MarketplaceOrderModel.find({}).populate('sellerId');
    
    if (orders.length === 0) {
      process.exit(0);
    }
    
    for (const order of orders) {
 
      
      // Check if sellerId is a user ID (string) instead of seller document
      if (typeof order.sellerId === 'string') {
        
        // Try to find the seller document for this user ID
        const sellerDoc = await MarketplaceSellerModel.findOne({ userId: order.sellerId });
        if (sellerDoc) {
          console.log('Found seller doc:', sellerDoc._id);
          console.log('Should update order.sellerId to:', sellerDoc._id);
        } else {
          console.log('No seller document found for user ID:', order.sellerId);
        }
      } else if (order.sellerId && order.sellerId._id) {
        console.log('✅ OK: sellerId is seller document');
        console.log('Seller name:', order.sellerId.sellerName || order.sellerId.storeName);
      } else {
        console.log('⚠️ WARNING: sellerId is null or invalid');
      }
      console.log('---');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOrders();
