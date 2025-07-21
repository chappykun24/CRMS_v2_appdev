// Test script to verify API connectivity
const fetch = require('node-fetch');

async function testAPIConnection() {
  const apiBaseURL = 'http://localhost:3001/api';
  
  console.log('🧪 Testing API connection...');
  console.log('📡 API Base URL:', apiBaseURL);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${apiBaseURL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health check successful:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test with headers similar to React Native
    console.log('\n2. Testing with React Native-like headers...');
    const testResponse = await fetch(`${apiBaseURL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (testResponse.ok) {
      console.log('✅ API connection test successful');
      console.log('📊 Response status:', testResponse.status);
      console.log('🔗 CORS headers present:', testResponse.headers.get('access-control-allow-origin') !== null);
    } else {
      console.log('❌ API connection test failed:', testResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server might not be running. Start it with: cd server && npm start');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Check if localhost is accessible');
    }
  }
}

// Run the test
testAPIConnection(); 