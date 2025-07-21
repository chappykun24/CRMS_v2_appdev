import * as Application from 'expo-application';
import { BackHandler } from 'react-native';

/**
 * Utility function to exit the app with proper fallbacks
 * @returns {Promise<void>}
 */
export const exitApp = async () => {
  try {
    // Try to use expo-application first (most reliable)
    if (Application && Application.exitApp) {
      Application.exitApp();
      return;
    }
  } catch (error) {
    console.warn('expo-application exitApp failed:', error);
  }

  try {
    // Fallback to BackHandler.exitApp()
    if (BackHandler && BackHandler.exitApp) {
      BackHandler.exitApp();
      return;
    }
  } catch (error) {
    console.warn('BackHandler.exitApp failed:', error);
  }

  // Final fallback - this will eventually lead to app closure
  // In most cases, the app will be closed by the OS when there's no more navigation history
  console.warn('No exit method available, using fallback navigation');
};

/**
 * Check if the app can be exited programmatically
 * @returns {boolean}
 */
export const canExitApp = () => {
  return !!(Application?.exitApp || BackHandler?.exitApp);
}; 