const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Original DB_URI:', process.env.DB_URI);
    
    // Try with database name added
    const dbUriWithDb = process.env.DB_URI + '/0xmintyn';
    console.log('With database name:', dbUriWithDb);
    
    await mongoose.connect(dbUriWithDb);
    console.log('✅ Connected successfully!');
    
    // Test if we can access collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available collections:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check specific collections
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', new mongoose.Schema({}, { strict: false }));
    const MarketplaceOfferModel = mongoose.model('MarketplaceOffer', new mongoose.Schema({}, { strict: false }));
    const UserModel = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', new mongoose.Schema({}, { strict: false }));
    
    const orderCount = await MarketplaceOrderModel.countDocuments();
    const offerCount = await MarketplaceOfferModel.countDocuments();
    const userCount = await UserModel.countDocuments();
    const sellerCount = await MarketplaceSellerModel.countDocuments();
    
    console.log('\n📊 Collection counts:');
    console.log(`Orders: ${orderCount}`);
    console.log(`Offers: ${offerCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Sellers: ${sellerCount}`);
    
    if (userCount > 0) {
      console.log('\n👥 Sample users:');
      const users = await UserModel.find({}).limit(3);
      users.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user._id}) - isSeller: ${user.isSeller}`);
      });
    }
    
    if (offerCount > 0) {
      console.log('\n🎯 Sample offers:');
      const offers = await MarketplaceOfferModel.find({}).limit(3);
      offers.forEach(offer => {
        console.log(`- Offer ${offer._id}: ${offer.status} - Price: $${offer.price}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
