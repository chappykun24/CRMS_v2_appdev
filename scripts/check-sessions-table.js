const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkSessionsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking sessions table structure...');
    
    // Check if sessions table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `;
    
    const tableExistsResult = await client.query(tableExistsQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    console.log('sessions table exists:', tableExists);
    
    if (tableExists) {
      // Get table structure
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery);
      console.log('\n📋 sessions table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check if table has data
      const countQuery = `SELECT COUNT(*) as count FROM sessions`;
      const countResult = await client.query(countQuery);
      console.log(`\n📊 Current sessions count: ${countResult.rows[0].count}`);
      
    } else {
      console.log('\n❌ Sessions table does not exist. Creating it...');
      
      // Create sessions table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sessions (
          session_id SERIAL PRIMARY KEY,
          section_course_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          session_type VARCHAR(50) DEFAULT 'Lecture',
          meeting_type VARCHAR(50) DEFAULT 'Face-to-Face',
          session_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (section_course_id) REFERENCES section_courses(section_course_id) ON DELETE CASCADE
        );
      `;
      
      await client.query(createTableQuery);
      console.log('✅ Sessions table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error checking sessions table:', error);
  } finally {
    client.release();
  }
}

checkSessionsTable()
  .then(() => {
    console.log('🎉 Sessions table check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 