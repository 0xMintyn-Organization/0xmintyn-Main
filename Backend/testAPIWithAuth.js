const axios = require('axios');
require('dotenv').config();

async function testAPIWithAuth() {
  try {
    console.log('Testing API with authentication...');
    
    // Test the API endpoint
    const orderId = '68ee8ccc99dc92d16c0eb789';
    const apiUrl = `https://appbackend.0xmintyn.com/api/v1/marketplace/orders/${orderId}`;
    
    console.log(`Testing: ${apiUrl}`);
    
    try {
      const response = await axios.get(apiUrl);
      console.log('✅ API Response (without auth):', response.data);
    } catch (error) {
      console.log('❌ API Error (without auth):', error.response?.data || error.message);
    }
    
    // Test buyer orders API
    const buyerOrdersUrl = 'https://appbackend.0xmintyn.com/api/v1/marketplace/orders/buyer';
    console.log(`\nTesting buyer orders: ${buyerOrdersUrl}`);
    
    try {
      const response = await axios.get(buyerOrdersUrl);
      console.log('✅ Buyer Orders Response:', response.data);
    } catch (error) {
      console.log('❌ Buyer Orders Error:', error.response?.data || error.message);
    }
    
    // Test seller orders API
    const sellerOrdersUrl = 'https://appbackend.0xmintyn.com/api/v1/marketplace/orders/seller';
    console.log(`\nTesting seller orders: ${sellerOrdersUrl}`);
    
    try {
      const response = await axios.get(sellerOrdersUrl);
      console.log('✅ Seller Orders Response:', response.data);
    } catch (error) {
      console.log('❌ Seller Orders Error:', error.response?.data || error.message);
    }
    
    console.log('\n💡 Note: These API calls will fail without authentication.');
    console.log('The frontend should work because it includes authentication cookies.');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testAPIWithAuth();
