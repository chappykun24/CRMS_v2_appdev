import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'db_cache_';

// Cache management
export class DatabaseCache {
  static async get(key) {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        // Cache expired, remove it
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  static async clearExpired() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp >= CACHE_DURATION) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache clear expired error:', error);
    }
  }
}

// Database query optimization
export class QueryOptimizer {
  static createPaginationQuery(page, limit, filters = []) {
    const offset = (page - 1) * limit;
    return {
      queries: filters,
      limit,
      offset
    };
  }

  static createSearchQuery(searchTerm, fields = []) {
    if (!searchTerm.trim()) return [];
    
    return fields.map(field => ({
      method: 'search',
      key: field,
      value: searchTerm
    }));
  }

  static createSortQuery(sortField, sortOrder = 'ASC') {
    return {
      method: 'order',
      key: sortField,
      direction: sortOrder
    };
  }
}

// Performance monitoring
export class PerformanceMonitor {
  static startTimer(operation) {
    return {
      operation,
      startTime: Date.now()
    };
  }

  static endTimer(timer) {
    const duration = Date.now() - timer.startTime;
    console.log(`⏱️ ${timer.operation} completed in ${duration}ms`);
    return duration;
  }

  static async measureOperation(operation, asyncFunction) {
    const timer = this.startTimer(operation);
    try {
      const result = await asyncFunction();
      this.endTimer(timer);
      return result;
    } catch (error) {
      this.endTimer(timer);
      throw error;
    }
  }
}

// Connection pooling simulation
export class ConnectionPool {
  static connectionCount = 0;
  static maxConnections = 5;
  static activeConnections = new Set();

  static async acquireConnection() {
    if (this.activeConnections.size >= this.maxConnections) {
      // Wait for a connection to be released
      await new Promise(resolve => {
        const checkConnection = () => {
          if (this.activeConnections.size < this.maxConnections) {
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    const connectionId = `conn_${++this.connectionCount}`;
    this.activeConnections.add(connectionId);
    return connectionId;
  }

  static releaseConnection(connectionId) {
    this.activeConnections.delete(connectionId);
  }
}

// Database operation wrapper with optimization
export class OptimizedDatabase {
  constructor(apiClient, tableName) {
    this.apiClient = apiClient;
    this.tableName = tableName;
  }

  async listDocuments(options = {}) {
    const cacheKey = `list_${this.tableName}_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await DatabaseCache.get(cacheKey);
    if (cached) {
      console.log('📦 Using cached data for', this.tableName);
      return cached;
    }

    // Perform database operation
    const connectionId = await ConnectionPool.acquireConnection();
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      const result = await PerformanceMonitor.measureOperation(
        `listDocuments(${this.tableName})`,
        () => this.apiClient.get(`/collections/${this.tableName}?limit=${limit}&offset=${offset}`)
      );

      // Cache the result
      await DatabaseCache.set(cacheKey, result);
      return result;
    } finally {
      ConnectionPool.releaseConnection(connectionId);
    }
  }

  async createDocument(data) {
    const connectionId = await ConnectionPool.acquireConnection();
    try {
      const result = await PerformanceMonitor.measureOperation(
        `createDocument(${this.tableName})`,
        () => this.apiClient.post(`/collections/${this.tableName}/documents`, data)
      );

      // Clear cache for this table
      await DatabaseCache.clear();
      return result;
    } finally {
      ConnectionPool.releaseConnection(connectionId);
    }
  }

  async updateDocument(documentId, data) {
    const connectionId = await ConnectionPool.acquireConnection();
    try {
      const result = await PerformanceMonitor.measureOperation(
        `updateDocument(${this.tableName})`,
        () => this.apiClient.put(`/collections/${this.tableName}/documents/${documentId}`, data)
      );

      // Clear cache for this table
      await DatabaseCache.clear();
      return result;
    } finally {
      ConnectionPool.releaseConnection(connectionId);
    }
  }

  async deleteDocument(documentId) {
    const connectionId = await ConnectionPool.acquireConnection();
    try {
      const result = await PerformanceMonitor.measureOperation(
        `deleteDocument(${this.tableName})`,
        () => this.apiClient.delete(`/collections/${this.tableName}/documents/${documentId}`)
      );

      // Clear cache for this table
      await DatabaseCache.clear();
      return result;
    } finally {
      ConnectionPool.releaseConnection(connectionId);
    }
  }
} 