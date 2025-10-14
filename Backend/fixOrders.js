const mongoose = require('mongoose');
require('dotenv').config();

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/0xmintyn');
    
    // Get MarketplaceOrderModel and MarketplaceSellerModel
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', new mongoose.Schema({}, { strict: false }));
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', new mongoose.Schema({}, { strict: false }));
    
    // Get all orders where sellerId might be a user ID instead of seller document ID
    const orders = await MarketplaceOrderModel.find({});
    console.log('Total orders found:', orders.length);
    
    let fixedCount = 0;
    
    for (const order of orders) {
      console.log(`\nChecking order ${order._id} (${order.orderNumber})`);
      
      // Check if sellerId looks like a user ID (ObjectId but not a seller document)
      if (order.sellerId) {
        // Try to find a seller document with this as userId
        const sellerDoc = await MarketplaceSellerModel.findOne({ userId: order.sellerId });
        
        if (sellerDoc) {
          console.log(`❌ ISSUE: Order ${order._id} has sellerId as user ID (${order.sellerId}) instead of seller doc ID`);
          console.log(`Found seller doc: ${sellerDoc._id} for user: ${order.sellerId}`);
          
          // Update the order to use the correct seller document ID
          await MarketplaceOrderModel.findByIdAndUpdate(order._id, {
            sellerId: sellerDoc._id
          });
          
          console.log(`✅ FIXED: Updated order ${order._id} to use seller doc ID: ${sellerDoc._id}`);
          fixedCount++;
        } else {
          // Check if sellerId is already a valid seller document ID
          const sellerDocById = await MarketplaceSellerModel.findById(order.sellerId);
          if (sellerDocById) {
            console.log(`✅ OK: Order ${order._id} already has correct seller doc ID: ${order.sellerId}`);
          } else {
            console.log(`⚠️ WARNING: Order ${order._id} has invalid sellerId: ${order.sellerId}`);
          }
        }
      } else {
        console.log(`⚠️ WARNING: Order ${order._id} has no sellerId`);
      }
    }
    
    console.log(`\n🎉 Fix complete! Fixed ${fixedCount} orders.`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrders();
