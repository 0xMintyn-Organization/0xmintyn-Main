const mongoose = require('mongoose');
require('dotenv').config();

async function debugOrders() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/0xmintyn');
    console.log('✅ Connected to MongoDB');
    
    // Get models
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', new mongoose.Schema({}, { strict: false }));
    const MarketplaceOfferModel = mongoose.model('MarketplaceOffer', new mongoose.Schema({}, { strict: false }));
    const UserModel = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', new mongoose.Schema({}, { strict: false }));
    
    console.log('\n📊 DATABASE STATS:');
    
    // Count all collections
    const orderCount = await MarketplaceOrderModel.countDocuments();
    const offerCount = await MarketplaceOfferModel.countDocuments();
    const userCount = await UserModel.countDocuments();
    const sellerCount = await MarketplaceSellerModel.countDocuments();
    
    console.log(`Orders: ${orderCount}`);
    console.log(`Offers: ${offerCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Sellers: ${sellerCount}`);
    
    if (orderCount > 0) {
      console.log('\n📋 ORDERS DETAILS:');
      const orders = await MarketplaceOrderModel.find({}).populate('buyerId', 'firstName lastName email').populate('sellerId');
      
      for (const order of orders) {
        console.log(`\nOrder ID: ${order._id}`);
        console.log(`Order Number: ${order.orderNumber}`);
        console.log(`Buyer: ${order.buyerId?.firstName || 'Unknown'} (${order.buyerId?._id})`);
        console.log(`Seller ID: ${order.sellerId} (Type: ${typeof order.sellerId})`);
        console.log(`Status: ${order.orderStatus}`);
        console.log(`Created: ${order.createdAt}`);
        console.log(`Items: ${order.items?.length || 0}`);
        if (order.items && order.items.length > 0) {
          console.log(`First Item: ${order.items[0].itemTitle}`);
        }
      }
    }
    
    if (offerCount > 0) {
      console.log('\n🎯 OFFERS DETAILS:');
      const offers = await MarketplaceOfferModel.find({}).populate('buyerId', 'firstName lastName').populate('sellerId', 'firstName lastName');
      
      for (const offer of offers) {
        console.log(`\nOffer ID: ${offer._id}`);
        console.log(`Status: ${offer.status}`);
        console.log(`Seller: ${offer.sellerId?.firstName || 'Unknown'} (${offer.sellerId})`);
        console.log(`Buyer: ${offer.buyerId?.firstName || 'Unknown'} (${offer.buyerId})`);
        console.log(`Price: $${offer.price}`);
        console.log(`Created: ${offer.createdAt}`);
        if (offer.acceptedAt) {
          console.log(`Accepted: ${offer.acceptedAt}`);
        }
      }
    }
    
    console.log('\n🔍 CHECKING SPECIFIC USERS:');
    
    // Check if there are any users
    const users = await UserModel.find({}).limit(5);
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user._id}) - isSeller: ${user.isSeller}`);
    });
    
    // Check sellers
    const sellers = await MarketplaceSellerModel.find({}).populate('userId', 'firstName lastName');
    console.log(`\nFound ${sellers.length} sellers:`);
    sellers.forEach(seller => {
      console.log(`- ${seller.sellerName} (${seller._id}) - User: ${seller.userId?.firstName} (${seller.userId})`);
    });
    
    console.log('\n✅ Debug complete');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugOrders();
