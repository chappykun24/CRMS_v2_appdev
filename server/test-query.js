const pool = require('./database');

async function testQuery() {
  try {
    console.log('Testing faculty query...');
    
    // Test the exact query from the users route
    const result = await pool.query(`
      SELECT u.user_id, u.name, u.email, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      WHERE r.name = $1
    `, ['Faculty']);
    
    console.log('Faculty users found:', result.rows.length);
    console.log('Users:', result.rows);
    
    // Test departments query
    console.log('\nTesting departments query...');
    const deptResult = await pool.query('SELECT * FROM departments');
    console.log('Departments found:', deptResult.rows.length);
    console.log('Departments:', deptResult.rows);
    
  } catch (error) {
    console.error('Error testing query:', error);
  } finally {
    await pool.end();
  }
}

testQuery(); 