const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'crms_v2_db',
  user: 'postgres',
  password: 'care0924'
});

async function testPassword() {
  try {
    // Get admin user's password hash
    const result = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['admin@university.edu']);
    const user = result.rows[0];
    
    console.log('Admin email:', user.email);
    console.log('Stored password hash:', user.password_hash);
    
    // Test different passwords
    const testPasswords = ['demo123', 'password', 'admin', '123456', 'admin123'];
    
    for (const password of testPasswords) {
      const match = await bcrypt.compare(password, user.password_hash);
      console.log(`Password "${password}" matches: ${match}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

testPassword(); 