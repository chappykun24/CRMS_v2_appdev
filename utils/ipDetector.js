import Constants from 'expo-constants';

// IP detection utility for mobile development
export class IPDetector {
  static async getLocalIP() {
    try {
      console.log('🔍 Starting IP detection...');
      
      // Manual override for testing (set this to your PC's IP if auto-detection fails)
      // For Android development, we need to use the PC's IP so the Android device can connect
      const MANUAL_IP_OVERRIDE = '192.168.1.207'; // PC's IP for Android device to connect to
      if (MANUAL_IP_OVERRIDE) {
        console.log('🔧 Using manual IP override:', MANUAL_IP_OVERRIDE);
        return MANUAL_IP_OVERRIDE;
      }
      
      // Method 1: Try to get LAN IP from Expo manifest
      if (Constants?.manifest?.debuggerHost) {
        console.log('🔍 Found Expo debuggerHost:', Constants.manifest.debuggerHost);
        const lanIP = Constants.manifest.debuggerHost.split(':')[0];
        if (lanIP && lanIP !== '127.0.0.1' && lanIP !== 'localhost') {
          console.log('✅ Using LAN IP from Expo manifest:', lanIP);
          return lanIP;
        }
      } else {
        console.log('⚠️ No Expo debuggerHost found');
      }

      // Method 2: Try to detect via local network service
      try {
        console.log('🔍 Trying local network detection...');
        const response = await fetch('http://192.168.1.1:8080/ip', { 
          method: 'GET',
          timeout: 2000 
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.ip) {
            console.log('✅ Using detected LAN IP:', data.ip);
            return data.ip;
          }
        }
      } catch (err) {
        console.log('⚠️ Local network detection failed:', err.message);
      }

      // Method 3: Try common local IP ranges
      const commonIPs = [
        '192.168.1.207', // Current detected IP (moved to top priority)
        '192.168.1.108', // Android device IP (from server logs)
        '192.168.1.109', // Previous manual override
        '192.168.1.205', // Actual connecting IP from logs
        '192.168.1.11', // Previous detected IP
        '192.168.193.146', // Previous server IP
        '192.168.192.118', // Frontend device IP
        '192.168.1.36', // From your Metro logs
        '192.168.1.104', // Newly added IP
        '192.168.1.1',
        '192.168.0.1',
        '10.0.0.1'
      ];

      for (const ip of commonIPs) {
        try {
          console.log(`🔍 Testing common IP: ${ip}`);
          const response = await fetch(`http://${ip}:3001/api/test`, {
            method: 'GET',
            timeout: 1000
          });
          if (response.ok) {
            console.log(`✅ Found working IP: ${ip}`);
            return ip;
          }
        } catch (err) {
          console.log(`❌ IP ${ip} not reachable`);
        }
      }

      // Fallback to localhost for dev
      console.log('⚠️ Using fallback: localhost');
      return 'localhost';
    } catch (error) {
      console.error('❌ IP detection failed:', error);
      // Fallback to localhost
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
      return 'http://localhost:3001/api'; // Fallback
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
      console.error('❌ Connection test error:', error);
      // Add more detailed error logging
      if (error.name === 'AbortError') {
        console.error('❌ Connection test timed out after 5 seconds');
      } else if (error.message.includes('Network request failed')) {
        console.error('❌ Network request failed - possible causes:');
        console.error('   - Server not running on port 3001');
        console.error('   - Network connectivity issues');
        console.error('   - CORS configuration problems');
        console.error('   - React Native network restrictions');
        console.error('   - Try restarting the server: cd server && npm start');
      }
      return false;
    }
  }
}

// Auto-update function that can be called on app startup
export const initializeAPIConfig = async () => {
  try {
    console.log('🚀 Initializing API configuration...');
    // Get the detected IP
    const apiBaseURL = await IPDetector.updateAPIConfig();
    // Test the connection
    const isConnected = await IPDetector.testConnection(apiBaseURL);
    if (isConnected) {
      console.log('✅ API configuration initialized successfully');
      return apiBaseURL;
    } else {
      console.log('⚠️ Connection test failed, using fallback');
      return 'http://localhost:3001/api';
    }
  } catch (error) {
    console.error('❌ API configuration initialization failed:', error);
    return 'http://localhost:3001/api';
  }
};

export default IPDetector; 