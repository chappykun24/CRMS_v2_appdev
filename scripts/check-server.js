const axios = require('axios');

async function checkServer() {
  try {
    console.log('🔍 Checking server status...');
    
    // Try to connect to the server
    const response = await axios.get('http://localhost:3000/api/health', {
      timeout: 5000
    });
    
    console.log('✅ Server is running and accessible');
    console.log('📊 Server response:', response.data);
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running (connection refused)');
      console.log('💡 Please start the server with: cd server && npm start');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Server host not found');
    } else if (error.response) {
      console.log('⚠️ Server responded with error:', error.response.status);
    } else {
      console.log('❌ Server check failed:', error.message);
    }
  }
}

checkServer(); 