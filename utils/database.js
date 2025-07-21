// Database configuration for PostgreSQL via API
import { apiClient } from './api';

// Database provider - PostgreSQL via API
const DATABASE_PROVIDER = 'api';

console.log('🔧 Database provider:', DATABASE_PROVIDER);

// Remove createDatabase and any collectionId logic

// Pre-configured database instances

// Export configuration for backward compatibility
export const databaseId = 'postgresql';

export const databases = apiClient;

// Export default client for backward compatibility
export default apiClient;

// Database utility functions
export const testConnection = async () => {
  try {
    return await apiClient.testConnection();
  } catch (error) {
    console.error(`❌ ${DATABASE_PROVIDER} connection test failed:`, error);
    return false;
  }
};

// Database health check
export const healthCheck = async () => {
  const isConnected = await testConnection();
  return {
    provider: DATABASE_PROVIDER,
    connected: isConnected,
    timestamp: new Date().toISOString()
  };
}; 