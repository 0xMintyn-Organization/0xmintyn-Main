const mongoose = require('mongoose');
require('dotenv').config();

async function fixSellerOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create models
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceOrderSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceSellerSchema = new mongoose.Schema({}, { strict: false });
    
    const UserModel = mongoose.model('User', UserSchema);
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', MarketplaceOrderSchema);
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', MarketplaceSellerSchema);
    
    console.log('\n🔍 Checking for orders with wrong sellerId...');
    
    // Get all orders
    const orders = await MarketplaceOrderModel.find({});
    console.log(`Found ${orders.length} orders`);
    
    if (orders.length === 0) {
      console.log('No orders found. The database might be empty.');
      console.log('This could explain why seller sees no orders.');
      process.exit(0);
    }
    
    let fixedCount = 0;
    
    for (const order of orders) {
      console.log(`\nChecking order ${order._id} (${order.orderNumber})`);
      console.log(`Current sellerId: ${order.sellerId} (Type: ${typeof order.sellerId})`);
      
      // Check if sellerId is a user ID instead of seller document ID
      if (order.sellerId) {
        // Try to find a seller document with this as userId
        const sellerDoc = await MarketplaceSellerModel.findOne({ userId: order.sellerId });
        
        if (sellerDoc) {
          console.log(`❌ ISSUE: Order has sellerId as user ID (${order.sellerId}) instead of seller doc ID`);
          console.log(`Found seller doc: ${sellerDoc._id} for user: ${order.sellerId}`);
          
          // Update the order to use the correct seller document ID
          await MarketplaceOrderModel.findByIdAndUpdate(order._id, {
            sellerId: sellerDoc._id
          });
          
          console.log(`✅ FIXED: Updated order to use seller doc ID: ${sellerDoc._id}`);
          fixedCount++;
        } else {
          // Check if sellerId is already a valid seller document ID
          const sellerDocById = await MarketplaceSellerModel.findById(order.sellerId);
          if (sellerDocById) {
            console.log(`✅ OK: Order already has correct seller doc ID: ${order.sellerId}`);
          } else {
            console.log(`⚠️ WARNING: Order has invalid sellerId: ${order.sellerId}`);
          }
        }
      } else {
        console.log(`⚠️ WARNING: Order has no sellerId`);
      }
    }
    
    console.log(`\n🎉 Fix complete! Fixed ${fixedCount} orders.`);
    
    if (fixedCount > 0) {
      console.log('\n📊 After fix - testing seller orders API logic...');
      
      // Test the seller orders API logic
      const sellers = await MarketplaceSellerModel.find({});
      console.log(`Found ${sellers.length} sellers`);
      
      for (const seller of sellers) {
        console.log(`\nTesting seller: ${seller.sellerName} (${seller._id})`);
        
        // This is the same logic as getSellerOrders API
        const sellerOrders = await MarketplaceOrderModel.find({
          sellerId: seller._id,
          isActive: true
        }).populate('buyerId', 'firstName lastName email');
        
        console.log(`Seller can see ${sellerOrders.length} orders`);
        
        for (const order of sellerOrders) {
          console.log(`- Order: ${order.orderNumber} - Buyer: ${order.buyerId?.firstName || 'Unknown'}`);
        }
      }
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSellerOrders();
