import NetInfo from '@react-native-community/netinfo';
import apiClient from './api';
import { initializeAPIConfig } from './ipDetector';

/**
 * Sets up a listener for network changes. On network change, re-initializes the API config.
 * @param {function} onAPIBaseURLChange - Optional callback when API base URL changes.
 * @returns {function} Unsubscribe function.
 */
export const setupNetworkListener = (onAPIBaseURLChange) => {
  // Listen for network changes
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      // Re-initialize API config on network change
      const newBaseURL = await initializeAPIConfig();
      apiClient.updateBaseURL(newBaseURL);
      if (onAPIBaseURLChange) onAPIBaseURLChange(newBaseURL);
      console.log('🔄 Network changed, API base URL updated:', newBaseURL);
    }
  });
  return unsubscribe;
}; 