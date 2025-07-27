const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

async function checkAnalyticsTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking analytics tables...');
    
    // Check if analytics_clusters table exists
    const checkClustersTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_clusters'
      );
    `;
    
    const clustersResult = await client.query(checkClustersTable);
    console.log('analytics_clusters table exists:', clustersResult.rows[0].exists);
    
    // Check if analytics_insights table exists
    const checkInsightsTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'analytics_insights'
      );
    `;
    
    const insightsResult = await client.query(checkInsightsTable);
    console.log('analytics_insights table exists:', insightsResult.rows[0].exists);
    
    // Check if reports table exists
    const checkReportsTable = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      );
    `;
    
    const reportsResult = await client.query(checkReportsTable);
    console.log('reports table exists:', reportsResult.rows[0].exists);
    
    // If analytics_clusters exists, check its structure
    if (clustersResult.rows[0].exists) {
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'analytics_clusters' 
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery);
      console.log('\n📋 analytics_clusters table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking analytics tables:', error);
  } finally {
    client.release();
  }
}

checkAnalyticsTables()
  .then(() => {
    console.log('🎉 Analytics tables check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }); 