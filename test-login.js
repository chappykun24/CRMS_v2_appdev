// Test script to verify login endpoint
const fetch = require('node-fetch');

async function testLogin() {
  const apiBaseURL = 'http://localhost:3001/api';
  
  console.log('🧪 Testing login endpoint...');
  console.log('📡 API Base URL:', apiBaseURL);
  
  try {
    // Test with admin credentials
    console.log('\n1. Testing admin login...');
    const loginResponse = await fetch(`${apiBaseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@university.edu',
        password: 'demo123'
      }),
    });
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('✅ Admin login successful:', {
        user_id: userData.user_id,
        email: userData.email,
        role: userData.role
      });
    } else {
      console.log('❌ Admin login failed:', loginResponse.status);
      const errorData = await loginResponse.text();
      console.log('Error details:', errorData);
    }
    
    // Test with faculty credentials
    console.log('\n2. Testing faculty login...');
    const facultyResponse = await fetch(`${apiBaseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dr.smith@university.edu',
        password: 'demo123'
      }),
    });
    
    if (facultyResponse.ok) {
      const userData = await facultyResponse.json();
      console.log('✅ Faculty login successful:', {
        user_id: userData.user_id,
        email: userData.email,
        role: userData.role
      });
    } else {
      console.log('❌ Faculty login failed:', facultyResponse.status);
      const errorData = await facultyResponse.text();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Login test error:', error.message);
  }
}

// Run the test
testLogin(); 