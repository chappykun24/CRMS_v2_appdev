// API utility for making requests to backend PostgreSQL server

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAPIConfig } from './ipDetector';

// Dynamic API base URL that will be set on app startup
let API_BASE_URL = 'http://192.168.1.9:3001/api'; // Default fallback

// Function to get local IP address (legacy support)
const getLocalIP = () => {
  // For development, use detected IP
  return '192.168.1.9';
};

// Initialize API configuration on app startup
export const initializeAPI = async () => {
  try {
    // Check AsyncStorage for saved API base URL
    const savedURL = await AsyncStorage.getItem('API_BASE_URL');
    if (savedURL) {
      API_BASE_URL = savedURL;
      apiClient.updateBaseURL(API_BASE_URL);
      console.log('✅ API Base URL loaded from storage:', API_BASE_URL);
      return API_BASE_URL;
    }
    console.log('🚀 Initializing API configuration...');
    API_BASE_URL = await initializeAPIConfig();
    console.log('✅ API Base URL set to:', API_BASE_URL);
    apiClient.updateBaseURL(API_BASE_URL);
    AsyncStorage.setItem('API_BASE_URL', API_BASE_URL);
    return API_BASE_URL;
  } catch (error) {
    console.error('❌ API initialization failed:', error);
    API_BASE_URL = 'http://192.168.1.9:3001/api';
    apiClient.updateBaseURL(API_BASE_URL);
    return API_BASE_URL;
  }
};

// Export the current API base URL
export const getAPIBaseURL = () => API_BASE_URL;

// Legacy export for backward compatibility
export { API_BASE_URL };

// Set the API base URL directly (for manual IP input)
export const setAPIBaseURL = (url) => {
  API_BASE_URL = url;
  apiClient.updateBaseURL(API_BASE_URL);
  AsyncStorage.setItem('API_BASE_URL', API_BASE_URL);
  console.log('✅ API Base URL manually set to:', API_BASE_URL);
};

// Helper function to get current IP (for manual updates)
export const getCurrentIP = () => {
  // You can run this in terminal: ipconfig | findstr "IPv4"
  console.log('🔍 To get your current IP, run: ipconfig | findstr "IPv4"');
  return getLocalIP();
};

class APIClient {
  constructor() {
    this.baseURL = getAPIBaseURL();
  }

  // Method to update base URL dynamically
  updateBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
    console.log('📡 APIClient base URL updated to:', newBaseURL);
  }

  // Get current base URL (always fresh)
  getBaseURL() {
    return getAPIBaseURL();
  }

  async request(endpoint, options = {}) {
    const url = `${this.getBaseURL()}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Test connection
  async testConnection() {
    try {
      const result = await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiClient = new APIClient();
export default apiClient; 