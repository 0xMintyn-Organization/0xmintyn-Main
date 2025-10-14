const mongoose = require('mongoose');
require('dotenv').config();

async function createTestData() {
  try {
    console.log('Connecting to MongoDB...');
    const connectionString = process.env.DB_URI.includes('/') && process.env.DB_URI.split('/').length > 3 
      ? process.env.DB_URI  
      : process.env.DB_URI + '/0xmintyn';
    
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
    
    // Create models
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceSellerSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceServiceSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceOrderSchema = new mongoose.Schema({}, { strict: false });
    const MarketplaceOfferSchema = new mongoose.Schema({}, { strict: false });
    
    const UserModel = mongoose.model('User', UserSchema);
    const MarketplaceSellerModel = mongoose.model('MarketplaceSeller', MarketplaceSellerSchema);
    const MarketplaceServiceModel = mongoose.model('MarketplaceService', MarketplaceServiceSchema);
    const MarketplaceOrderModel = mongoose.model('MarketplaceOrder', MarketplaceOrderSchema);
    const MarketplaceOfferModel = mongoose.model('MarketplaceOffer', MarketplaceOfferSchema);
    
    console.log('\n🧹 Cleaning existing data...');
    await UserModel.deleteMany({});
    await MarketplaceSellerModel.deleteMany({});
    await MarketplaceServiceModel.deleteMany({});
    await MarketplaceOrderModel.deleteMany({});
    await MarketplaceOfferModel.deleteMany({});
    
    console.log('\n👥 Creating test users...');
    
    // Create buyer user
    const buyer = await UserModel.create({
      firstName: 'John',
      lastName: 'Buyer',
      email: 'buyer@test.com',
      username: 'buyer-user',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      isSeller: false,
      isActive: true,
      role: 'user'
    });
    
    // Create seller user
    const seller = await UserModel.create({
      firstName: 'Jane',
      lastName: 'Seller',
      email: 'seller@test.com',
      username: 'seller-user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      isSeller: true,
      isActive: true,
      role: 'user'
    });
    
    console.log(`✅ Created buyer: ${buyer.firstName} (${buyer._id})`);
    console.log(`✅ Created seller: ${seller.firstName} (${seller._id})`);
    
    console.log('\n🏪 Creating seller profile...');
    
    const sellerProfile = await MarketplaceSellerModel.create({
      userId: seller._id,
      sellerName: 'Jane Seller',
      storeName: 'CreativeDesigns',
      storeDescription: 'Professional design services',
      storeLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      businessType: 'Individual',
      sellerType: 'services',
      sellerLevel: 'Level 1',
      verified: true,
      rating: 4.8,
      totalSales: 0,
      totalEarnings: 0,
      isActive: true
    });
    
    console.log(`✅ Created seller profile: ${sellerProfile.storeName} (${sellerProfile._id})`);
    
    console.log('\n🎨 Creating test service...');
    
    const service = await MarketplaceServiceModel.create({
      sellerId: sellerProfile._id,
      title: 'Professional Logo Design',
      description: 'Custom logo design with 3 concepts and unlimited revisions',
      category: 'Design & Creative',
      images: ['https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop'],
      thumbnailImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop',
      packages: [
        {
          name: 'Basic',
          description: 'Simple logo design',
          price: 50,
          deliveryTime: '2 Days',
          revisions: 2,
          features: ['1 Logo Concept', '2 Revisions', 'PNG & JPG Files']
        },
        {
          name: 'Standard',
          description: 'Professional logo with brand guidelines',
          price: 100,
          deliveryTime: '3 Days',
          revisions: 3,
          features: ['3 Logo Concepts', '3 Revisions', 'PNG, JPG, SVG Files', 'Brand Guidelines']
        },
        {
          name: 'Premium',
          description: 'Complete brand identity package',
          price: 200,
          deliveryTime: '5 Days',
          revisions: 5,
          features: ['5 Logo Concepts', 'Unlimited Revisions', 'All File Formats', 'Brand Guidelines', 'Business Card Design']
        }
      ],
      tags: ['logo', 'design', 'branding', 'graphic'],
      isActive: true,
      isFeatured: true,
      isApproved: true,
      approvalStatus: 'approved'
    });
    
    console.log(`✅ Created service: ${service.title} (${service._id})`);
    
    console.log('\n🎯 Creating test offer...');
    
    const offer = await MarketplaceOfferModel.create({
      conversationId: 'test-conversation-123',
      sellerId: seller._id, // User ID
      buyerId: buyer._id,
      serviceId: service._id,
      offerTitle: 'Custom Logo Design Package',
      offerDescription: 'Professional logo design with your specifications',
      deliverables: ['Logo in PNG format', 'Logo in SVG format', 'Brand guidelines'],
      price: 150,
      deliveryTime: '3 Days',
      revisions: 3,
      status: 'accepted',
      acceptedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true
    });
    
    console.log(`✅ Created offer: ${offer.offerTitle} (${offer._id})`);
    
    console.log('\n📦 Creating test order...');
    
    const order = await MarketplaceOrderModel.create({
      orderNumber: `ORD-${Date.now()}-0001`,
      buyerId: buyer._id,
      sellerId: sellerProfile._id, // Seller document ID
      offerId: offer._id,
      items: [{
        itemId: service._id,
        itemType: 'service',
        itemTitle: service.title,
        itemPrice: 150,
        itemImage: service.thumbnailImage,
        quantity: 1,
        totalPrice: 150,
        packageDetails: {
          packageName: 'Custom Package',
          features: offer.deliverables,
          deliveryTime: offer.deliveryTime,
          revisions: offer.revisions
        }
      }],
      orderTotal: 150,
      currency: 'USD',
      paymentStatus: 'pending',
      paymentMethod: 'pending',
      paymentDetails: {
        amount: 150,
        fees: 15, // 10% platform fee
        netAmount: 135
      },
      orderStatus: 'processing',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      startedAt: new Date(),
      statusHistory: [{
        status: 'processing',
        timestamp: new Date(),
        note: 'Order created from accepted offer. Estimated delivery: 3 days.'
      }],
      notes: 'Custom logo design package',
      isActive: true
    });
    
    console.log(`✅ Created order: ${order.orderNumber} (${order._id})`);
    
    // Update user's purchased items
    await UserModel.findByIdAndUpdate(buyer._id, {
      $push: {
        purchasedItems: {
          itemId: service._id,
          itemType: 'service',
          purchaseDate: new Date(),
          orderId: order._id
        }
      }
    });
    
    // Update seller stats
    await MarketplaceSellerModel.findByIdAndUpdate(sellerProfile._id, {
      $inc: { totalSales: 1 }
    });
    
    // Update service stats
    await MarketplaceServiceModel.findByIdAndUpdate(service._id, {
      $inc: { orderCount: 1 }
    });
    
    console.log('\n📊 Final counts:');
    const finalOrderCount = await MarketplaceOrderModel.countDocuments();
    const finalOfferCount = await MarketplaceOfferModel.countDocuments();
    const finalUserCount = await UserModel.countDocuments();
    const finalSellerCount = await MarketplaceSellerModel.countDocuments();
    const finalServiceCount = await MarketplaceServiceModel.countDocuments();
    
    console.log(`Orders: ${finalOrderCount}`);
    console.log(`Offers: ${finalOfferCount}`);
    console.log(`Users: ${finalUserCount}`);
    console.log(`Sellers: ${finalSellerCount}`);
    console.log(`Services: ${finalServiceCount}`);
    
    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log(`Buyer: ${buyer.email} (${buyer.username})`);
    console.log(`Seller: ${seller.email} (${seller.username})`);
    console.log('\n🔗 Test URLs:');
    console.log('Buyer Orders: http://localhost:8000/api/v1/marketplace/orders/buyer');
    console.log('Seller Orders: http://localhost:8000/api/v1/marketplace/orders/seller');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
