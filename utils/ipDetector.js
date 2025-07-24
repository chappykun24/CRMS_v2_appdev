import Constants from 'expo-constants';

// IP detection utility for mobile development
export class IPDetector {
  static async getLocalIP(onProgress) {
    try {
      console.log('🔍 Starting IP detection...');
      // Method 1: Try to get LAN IP from Expo manifest
      if (Constants?.manifest?.debuggerHost) {
        console.log('🔍 Found Expo debuggerHost:', Constants.manifest.debuggerHost);
        const lanIP = Constants.manifest.debuggerHost.split(':')[0];
        if (lanIP && lanIP !== '127.0.0.1' && lanIP !== 'localhost') {
          console.log('✅ Using LAN IP from Expo manifest:', lanIP);
          if (onProgress) onProgress([lanIP], lanIP, 'Found LAN IP from Expo manifest');
          return lanIP;
        }
      } else {
        console.log('⚠️ No Expo debuggerHost found');
        if (onProgress) onProgress([], '', 'No Expo debuggerHost found');
      }
      // Method 2: Try to detect via local network service
      try {
        console.log('🔍 Trying local network detection...');
        if (onProgress) onProgress([], '192.168.1.1', 'Trying local network detection...');
        const response = await fetch('http://192.168.1.1:8080/ip', { 
          method: 'GET',
          timeout: 2000 
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.ip) {
            console.log('✅ Using detected LAN IP:', data.ip);
            if (onProgress) onProgress([data.ip], data.ip, 'Detected LAN IP from local network');
            return data.ip;
          }
        }
      } catch (err) {
        console.log('⚠️ Local network detection failed:', err.message);
        if (onProgress) onProgress([], '', 'Local network detection failed');
      }
      // Method 3: Try common local IP ranges (no ipconfig)
      const commonIPs = [
        '192.168.1.207', '192.168.1.108', '192.168.1.109', '192.168.1.205',
        '192.168.1.11', '192.168.193.146', '192.168.192.118', '192.168.1.36',
        '192.168.1.104', '192.168.1.1', '192.168.0.1', '10.0.0.1'
      ];
      let triedIPs = [];
      for (const ip of commonIPs) {
        triedIPs.push(ip);
        if (onProgress) onProgress([...triedIPs], ip, `Testing IP: ${ip}`);
        try {
          const response = await fetch(`http://${ip}:3001/api/test`, { method: 'GET', timeout: 1000 });
          if (response.ok) {
            if (onProgress) onProgress([...triedIPs], ip, `Found working IP: ${ip}`);
            return ip;
          }
        } catch (err) {
          // continue
        }
      }
      if (onProgress) onProgress([...triedIPs], '192.168.1.9', 'Using fallback IP');
      return '192.168.1.9';
    } catch (error) {
      if (onProgress) onProgress([], 'localhost', 'IP detection failed');
      return 'localhost';
    }
  }

  static async detectNetworkIP() {
    // For now, just use getLocalIP
    return this.getLocalIP();
  }

  static async updateAPIConfig() {
    try {
      const detectedIP = await this.getLocalIP();
      console.log('🔍 Detected IP:', detectedIP);
      // Use port 3001 for backend
      const newAPIBaseURL = `http://${detectedIP}:3001/api`;
      console.log('📡 Updated API Base URL:', newAPIBaseURL);
      return newAPIBaseURL;
    } catch (error) {
      console.error('❌ Failed to update API config:', error);
      return 'http://192.168.1.9:3001/api'; // Fallback
    }
  }

  static async testConnection(apiBaseURL) {
    try {
      console.log('🧪 Testing connection to:', apiBaseURL);
      // Add timeout for React Native environments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      // First test the simple endpoint
      console.log('🧪 Testing simple endpoint...');
      const testResponse = await fetch(`${apiBaseURL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      if (testResponse.ok) {
        console.log('✅ Simple endpoint test successful');
      } else {
        console.log('❌ Simple endpoint test failed:', testResponse.status);
        clearTimeout(timeoutId);
        return false;
      }
      // Then test the health endpoint
      console.log('🧪 Testing health endpoint...');
      const response = await fetch(`${apiBaseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        console.log('✅ Connection test successful');
        return true;
      } else {
        console.log('❌ Connection test failed:', response.status);
        return false;
      }
    } catch (error) {
      // Silently fail, do not log
      return false;
    }
  }
}

// Auto-update function that can be called on app startup
export const initializeAPIConfig = async () => {
  try {
    // Get the detected IP
    const apiBaseURL = await IPDetector.updateAPIConfig();
    // Test the connection
    try {
      const isConnected = await IPDetector.testConnection(apiBaseURL);
      if (isConnected) {
        return apiBaseURL;
      } else {
        // Silently fallback
        return 'http://192.168.1.9:3001/api';
      }
    } catch (e) {
      // Silently fallback
      return 'http://192.168.1.9:3001/api';
    }
  } catch (error) {
    // Silently fallback
    return 'http://192.168.1.9:3001/api';
  }
};

export default IPDetector; 