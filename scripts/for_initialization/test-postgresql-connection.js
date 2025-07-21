const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL configuration - same as in your postgresql.js
const config = {
  host: process.env.EXPO_PUBLIC_POSTGRES_HOST || 'localhost',
  port: process.env.EXPO_PUBLIC_POSTGRES_PORT || 5432,
  database: process.env.EXPO_PUBLIC_POSTGRES_DB || 'crms_v2_db',
  user: process.env.EXPO_PUBLIC_POSTGRES_USER || 'postgres',
  password: process.env.EXPO_PUBLIC_POSTGRES_PASSWORD || 'care0924',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('🔧 Testing PostgreSQL connection with config:');
console.log('   Host:', config.host);
console.log('   Port:', config.port);
console.log('   Database:', config.database);
console.log('   User:', config.user);
console.log('   Password:', config.password ? '***SET***' : '***NOT SET***');
console.log('');

// Create connection pool
const pool = new Pool(config);

async function testConnection() {
  console.log('🔄 Attempting to connect to PostgreSQL...');
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test a simple query
    console.log('🔄 Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executed successfully!');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    // Test if our database exists and list tables
    console.log('🔄 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Found tables in database:');
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    } else {
      console.log('⚠️  No tables found in database. You may need to run the initialization script.');
    }
    
    // Test specific tables that should exist
    const expectedTables = ['users', 'students', 'syllabi', 'courses', 'departments', 'programs'];
    console.log('🔄 Checking for expected tables...');
    
    for (const tableName of expectedTables) {
      try {
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);
        
        if (tableCheck.rows[0].exists) {
          console.log(`   ✅ Table '${tableName}' exists`);
          
          // Count rows in the table
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`      Rows: ${countResult.rows[0].count}`);
        } else {
          console.log(`   ❌ Table '${tableName}' does not exist`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking table '${tableName}':`, error.message);
      }
    }
    
    client.release();
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   - Make sure PostgreSQL server is running');
      console.error('   - Check if the host and port are correct');
      console.error('   - Verify PostgreSQL is listening on the specified port');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed:');
      console.error('   - Check your username and password');
      console.error('   - Verify the user has access to the database');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist:');
      console.error('   - Create the database first');
      console.error('   - Check the database name in your configuration');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});

// Run the test
testConnection().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
}); 