const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function debugFacultyEndpoint() {
  console.log('🔍 Debugging faculty assessments endpoint...\n');
  
  try {
    // Test with faculty ID 6 (Robert O Smith)
    console.log('1️⃣ Testing faculty assessments endpoint with ID 6:');
    const response = await axios.get(`${BASE_URL}/assessments/faculty/6`);
    console.log('✅ Faculty assessments endpoint working');
    console.log(`   Found ${response.data.length} assessments`);
    
    if (response.data.length > 0) {
      console.log('   First assessment:', response.data[0].title);
    }
  } catch (error) {
    console.log('❌ Faculty assessments endpoint failed');
    console.log('   Error status:', error.response?.status);
    console.log('   Error message:', error.response?.data);
    
    // Try to get more details about the error
    if (error.response?.data?.error) {
      console.log('   Error details:', error.response.data.error);
    }
  }
  
  console.log('\n2️⃣ Testing with different faculty ID (9):');
  try {
    const response = await axios.get(`${BASE_URL}/assessments/faculty/9`);
    console.log('✅ Faculty assessments endpoint working for ID 9');
    console.log(`   Found ${response.data.length} assessments`);
  } catch (error) {
    console.log('❌ Faculty assessments endpoint failed for ID 9');
    console.log('   Error:', error.response?.data);
  }
  
  console.log('\n3️⃣ Testing with non-existent faculty ID (999):');
  try {
    const response = await axios.get(`${BASE_URL}/assessments/faculty/999`);
    console.log('✅ Faculty assessments endpoint working for non-existent ID');
    console.log(`   Found ${response.data.length} assessments (should be 0)`);
  } catch (error) {
    console.log('❌ Faculty assessments endpoint failed for non-existent ID');
    console.log('   Error:', error.response?.data);
  }
}

debugFacultyEndpoint(); 