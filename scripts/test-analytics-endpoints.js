const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAnalyticsEndpoints() {
  try {
    console.log('🧪 Testing Analytics Endpoints...\n');
    
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running');
    } catch (error) {
      console.log('❌ Server is not running or health endpoint not available');
      return;
    }
    
    // Test 2: Test analytics cache endpoint (should return 404 if table doesn't exist)
    console.log('\n2. Testing analytics cache endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/analytics/cache/faculty/1`);
      console.log('✅ Analytics cache endpoint working:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 500) {
        console.log('⚠️ Analytics cache endpoint error (table may not exist):', error.response.data);
      } else {
        console.log('❌ Analytics cache endpoint error:', error.message);
      }
    }
    
    // Test 3: Test syllabus endpoint
    console.log('\n3. Testing syllabus endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/syllabus/approved?facultyId=1`);
      console.log('✅ Syllabus endpoint working, found classes:', response.data.length || 0);
    } catch (error) {
      console.log('❌ Syllabus endpoint error:', error.message);
    }
    
    console.log('\n🎯 Analytics endpoints test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAnalyticsEndpoints(); 