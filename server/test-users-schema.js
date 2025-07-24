const pool = require('./database');

async function testUsersSchema() {
  try {
    console.log('Testing users table schema...');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    structureResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Test a simple query without sr_code
    console.log('\nTesting simple users query...');
    const simpleResult = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.is_approved, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE r.name = $1
      LIMIT 5
    `, ['Faculty']);
    
    console.log('Faculty users found:', simpleResult.rows.length);
    console.log('Sample users:', simpleResult.rows);
    
  } catch (error) {
    console.error('Error testing users schema:', error);
  } finally {
    await pool.end();
  }
}

testUsersSchema(); 