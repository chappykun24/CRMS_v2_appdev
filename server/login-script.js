// test-login.js
const axios = require('axios');

const email = 'admin@university.edu'; // <-- change this to your test email
const password = 'demo123';       // <-- change this to your test password

console.log('--- LOGIN SCRIPT START ---');
console.log('Attempting login with:');
console.log('Email:', email);
console.log('Password:', password ? '[HIDDEN]' : 'undefined');

axios.post('http://localhost:3001/api/auth/login', { email, password })
  .then(res => {
    console.log('✅ Login successful!');
    console.log('User data:', res.data);
    console.log('--- LOGIN SCRIPT END (SUCCESS) ---');
  })
  .catch(err => {
    console.log('❌ Login failed!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Status Text:', err.response.statusText);
      console.log('Headers:', err.response.headers);
      console.log('Data:', err.response.data);
    } else if (err.request) {
      console.log('No response received from server.');
      console.log('Request details:', err.request);
    } else {
      console.log('Error setting up request:', err.message);
    }
    console.log('Full error object:', err);
    console.log('--- LOGIN SCRIPT END (FAILURE) ---');
  });