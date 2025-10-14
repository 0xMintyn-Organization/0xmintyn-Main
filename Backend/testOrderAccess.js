const mongoose = require('mongoose');
require('dotenv').config();

async function testOrderAccess() {
  try {
    console.log('Testing order access...');
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create models
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceOrderSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceSellerSchema = new mongoose.Schema({}, { strict: false });
    
    const UserModel = mongoose.model('User', UserSchema);
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', MarketplaceOrderSchema);
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', MarketplaceSellerSchema);
    
    const orderId = '68ee8ccc99dc92d16c0eb789';
    
    console.log(`\n🔍 Looking for order: ${orderId}`);
    
    // Check if order exists
    const order = await MarketplaceOrderModel.findById(orderId);
    if (!order) {
      console.log('❌ Order not found in database');
      process.exit(1);
    }
    
    console.log('✅ Order found!');
    console.log(`Order Number: ${order.orderNumber}`);
    console.log(`Buyer ID: ${order.buyerId}`);
    console.log(`Seller ID: ${order.sellerId}`);
    console.log(`Status: ${order.orderStatus}`);
    console.log(`Active: ${order.isActive}`);
    
    // Check buyer
    const buyer = await UserModel.findById(order.buyerId);
    if (buyer) {
      console.log(`\n👤 Buyer: ${buyer.firstName} ${buyer.lastName} (${buyer._id})`);
    } else {
      console.log(`\n❌ Buyer not found: ${order.buyerId}`);
    }
    
    // Check seller
    const seller = await MarketplaceSellerModel.findById(order.sellerId);
    if (seller) {
      console.log(`\n🏪 Seller: ${seller.sellerName} (${seller._id})`);
      
      // Check seller's user
      const sellerUser = await UserModel.findById(seller.userId);
      if (sellerUser) {
        console.log(`Seller User: ${sellerUser.firstName} ${sellerUser.lastName} (${sellerUser._id})`);
      } else {
        console.log(`❌ Seller user not found: ${seller.userId}`);
      }
    } else {
      console.log(`❌ Seller not found: ${order.sellerId}`);
    }
    
    console.log('\n🧪 Testing API logic...');
    
    // Test buyer access
    if (buyer) {
      const buyerOrder = await MarketplaceOrderModel.findOne({
        _id: orderId,
        isActive: true,
        buyerId: buyer._id
      });
      console.log(`Buyer can access order: ${buyerOrder ? '✅ YES' : '❌ NO'}`);
    }
    
    // Test seller access
    if (seller) {
      const sellerOrder = await MarketplaceOrderModel.findOne({
        _id: orderId,
        isActive: true,
        sellerId: seller._id
      });
      console.log(`Seller can access order: ${sellerOrder ? '✅ YES' : '❌ NO'}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOrderAccess();
