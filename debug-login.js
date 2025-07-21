const axios = require('axios');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'crms_v2_db',
  user: 'postgres',
  password: 'care0924'
});

// Role mapping for testing
const BACKEND_TO_FRONTEND_ROLES = {
  'administrator': 'admin',
  'dean': 'dean',
  'program chair': 'program_chair', 
  'faculty': 'faculty',
  'staff': 'staff'
};

const mapBackendRoleToFrontend = (backendRole) => {
  console.log('[Debug] Role mapping input:', backendRole);
  const mappedRole = BACKEND_TO_FRONTEND_ROLES[backendRole.toLowerCase()];
  console.log('[Debug] Role mapping result:', mappedRole);
  return mappedRole;
};

async function debugLoginFlow() {
  console.log('🔍 === COMPREHENSIVE LOGIN DEBUG ===\n');
  
  try {
    // Step 1: Test database connection
    console.log('📊 Step 1: Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Step 2: Check user exists
    console.log('\n📊 Step 2: Checking user in database...');
    const userQuery = `
      SELECT users.*, roles.name AS role
      FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE LOWER(users.email) = LOWER($1) AND users.is_approved = TRUE
    `;
    
    const userResult = await client.query(userQuery, ['admin@university.edu']);
    console.log('📋 Query executed');
    console.log('📋 Rows returned:', userResult.rows.length);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No user found or user not approved');
      client.release();
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_approved: user.is_approved,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });
    
    // Step 3: Test password verification
    console.log('\n📊 Step 3: Testing password verification...');
    const testPassword = 'demo123';
    const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log('🔐 Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ Password verification failed');
      client.release();
      return;
    }
    
    console.log('✅ Password verification successful');
    
    // Step 4: Test role mapping
    console.log('\n📊 Step 4: Testing role mapping...');
    console.log('🎭 Original role from database:', user.role);
    const mappedRole = mapBackendRoleToFrontend(user.role);
    console.log('🎭 Mapped role:', mappedRole);
    
    // Step 5: Test server connectivity
    console.log('\n📊 Step 5: Testing server connectivity...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Server is running');
      console.log('📊 Health response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server connectivity failed:', error.message);
      console.log('💡 Please start the server with: cd server && node server.js');
      client.release();
      return;
    }
    
    // Step 6: Test login API
    console.log('\n📊 Step 6: Testing login API...');
    try {
      const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'admin@university.edu',
        password: 'demo123'
      });
      
      console.log('✅ Login API call successful');
      console.log('📊 Response status:', loginResponse.status);
      console.log('📋 Response data:', JSON.stringify(loginResponse.data, null, 2));
      
      // Step 7: Test role mapping in response
      console.log('\n📊 Step 7: Testing role mapping in API response...');
      const apiUser = loginResponse.data;
      console.log('🎭 Role from API response:', apiUser.role);
      console.log('🎭 Role type:', typeof apiUser.role);
      
      const finalMappedRole = mapBackendRoleToFrontend(apiUser.role);
      console.log('🎭 Final mapped role:', finalMappedRole);
      
      // Step 8: Test UserRole constants
      console.log('\n📊 Step 8: Testing UserRole constants...');
      const UserRole = {
        ADMIN: 'admin',
        DEAN: 'dean',
        PROGRAM_CHAIR: 'program_chair',
        FACULTY: 'faculty',
        STAFF: 'staff'
      };
      
      console.log('🎭 UserRole.ADMIN:', UserRole.ADMIN);
      console.log('🎭 UserRole.DEAN:', UserRole.DEAN);
      console.log('🎭 UserRole.PROGRAM_CHAIR:', UserRole.PROGRAM_CHAIR);
      console.log('🎭 UserRole.FACULTY:', UserRole.FACULTY);
      console.log('🎭 UserRole.STAFF:', UserRole.STAFF);
      
      console.log('🎭 Role comparison (admin):', finalMappedRole === UserRole.ADMIN);
      console.log('🎭 Role comparison (dean):', finalMappedRole === UserRole.DEAN);
      console.log('🎭 Role comparison (program_chair):', finalMappedRole === UserRole.PROGRAM_CHAIR);
      console.log('🎭 Role comparison (faculty):', finalMappedRole === UserRole.FACULTY);
      console.log('🎭 Role comparison (staff):', finalMappedRole === UserRole.STAFF);
      
    } catch (error) {
      console.log('❌ Login API call failed');
      console.log('🚨 Error type:', error.constructor.name);
      console.log('🚨 Error message:', error.message);
      
      if (error.response) {
        console.log('📊 Error response status:', error.response.status);
        console.log('📋 Error response data:', error.response.data);
      }
    }
    
    client.release();
    
  } catch (error) {
    console.log('❌ Debug process failed:', error.message);
    console.log('🚨 Error stack:', error.stack);
  }
  
  console.log('\n🏁 === DEBUG COMPLETED ===');
  process.exit(0);
}

debugLoginFlow(); 