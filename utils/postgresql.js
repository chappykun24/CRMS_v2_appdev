import { Pool } from 'pg';

// PostgreSQL configuration
const config = {
  host: process.env.EXPO_PUBLIC_POSTGRES_HOST || 'localhost',
  port: process.env.EXPO_PUBLIC_POSTGRES_PORT || 5432,
  database: process.env.EXPO_PUBLIC_POSTGRES_DB || 'crms_v2_db',
  user: process.env.EXPO_PUBLIC_POSTGRES_USER || 'postgres',
  password: process.env.EXPO_PUBLIC_POSTGRES_PASSWORD || 'care0924',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('🔧 PostgreSQL config:', { 
  host: config.host, 
  port: config.port, 
  database: config.database,
  user: config.user 
});

// Create connection pool
const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Remove all document/collection methods and comments

// Export the pool for direct queries if needed
export { pool };

// Export the pool for direct database queries
export default pool; 