import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug logging function
const debugLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[LogoutDebugger] ${timestamp} - ${message}`);
  
  // You can also store this in a global debug state if needed
  if (global.logoutDebugLog) {
    global.logoutDebugLog.push({ timestamp, message, type });
  }
};

export async function logoutAndRedirect(router, logout) {
  debugLog('=== Starting logoutAndRedirect ===', 'header');
  
  try {
    // Step 1: Set welcome flag
    debugLog('Step 1: Setting hasSeenWelcome flag', 'step');
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    debugLog('hasSeenWelcome flag set successfully', 'success');
    
    // Step 2: Check current storage state
    debugLog('Step 2: Checking current storage state', 'step');
    const userData = await AsyncStorage.getItem('user');
    debugLog(`Current user data in storage: ${userData ? 'exists' : 'null'}`, 'info');
    
    // Step 3: Execute logout function
    debugLog('Step 3: Executing logout function', 'step');
    debugLog(`Logout function provided: ${typeof logout}`, 'info');
    
    if (typeof logout === 'function') {
      await logout();
      debugLog('Logout function executed successfully', 'success');
    } else {
      debugLog('No logout function provided, skipping', 'warning');
    }
    
    // Step 4: Check storage state after logout
    debugLog('Step 4: Checking storage state after logout', 'step');
    const userDataAfter = await AsyncStorage.getItem('user');
    debugLog(`User data after logout: ${userDataAfter ? 'still exists' : 'removed'}`, 'info');
    
    // Step 5: Navigation
    debugLog('Step 5: Attempting navigation', 'step');
    debugLog(`Router provided: ${!!router}`, 'info');
    
    if (router) {
      try {
        debugLog('Attempting to navigate to /public', 'info');
        router.push('/public');
        debugLog('Navigation to /public successful', 'success');
      } catch (error) {
        debugLog(`Navigation error: ${error.message}`, 'error');
      }
    } else {
      debugLog('No router provided, skipping navigation', 'warning');
    }
    
    debugLog('=== logoutAndRedirect completed successfully ===', 'header');
    
  } catch (error) {
    debugLog(`Error in logoutAndRedirect: ${error.message}`, 'error');
    debugLog(`Error stack: ${error.stack}`, 'error');
    
    // Try to navigate even if there was an error
    if (router) {
      try {
        debugLog('Attempting emergency navigation after error', 'info');
        router.push('/public');
        debugLog('Emergency navigation successful', 'success');
      } catch (navError) {
        debugLog(`Emergency navigation failed: ${navError.message}`, 'error');
      }
    }
  }
}

// Enhanced logout function with more detailed logging
export async function enhancedLogout(router, logout) {
  debugLog('=== Starting enhancedLogout ===', 'header');
  
  const startTime = Date.now();
  
  try {
    // Pre-logout state check
    debugLog('Pre-logout state check', 'step');
    const preUserData = await AsyncStorage.getItem('user');
    const preWelcomeFlag = await AsyncStorage.getItem('hasSeenWelcome');
    debugLog(`Pre-logout - User: ${preUserData ? 'exists' : 'null'}, Welcome: ${preWelcomeFlag}`, 'info');
    
    // Execute logout
    if (typeof logout === 'function') {
      debugLog('Executing logout function', 'step');
      await logout();
      debugLog('Logout function completed', 'success');
    }
    
    // Post-logout state check
    debugLog('Post-logout state check', 'step');
    const postUserData = await AsyncStorage.getItem('user');
    const postWelcomeFlag = await AsyncStorage.getItem('hasSeenWelcome');
    debugLog(`Post-logout - User: ${postUserData ? 'exists' : 'null'}, Welcome: ${postWelcomeFlag}`, 'info');
    
    // Navigation with retry logic
    if (router) {
      debugLog('Starting navigation process', 'step');
      
      const navigationAttempts = [
        { route: '/public', description: 'Home page (public)' }
      ];
      
      for (let i = 0; i < navigationAttempts.length; i++) {
        const attempt = navigationAttempts[i];
        try {
          debugLog(`Navigation attempt ${i + 1}: ${attempt.description}`, 'info');
          router.push(attempt.route);
          debugLog(`Navigation to ${attempt.route} successful`, 'success');
          break;
        } catch (error) {
          debugLog(`Navigation attempt ${i + 1} failed: ${error.message}`, 'error');
          if (i === navigationAttempts.length - 1) {
            debugLog('All navigation attempts failed', 'error');
          }
        }
      }
    }
    
    const duration = Date.now() - startTime;
    debugLog(`=== enhancedLogout completed in ${duration}ms ===`, 'header');
    
  } catch (error) {
    const duration = Date.now() - startTime;
    debugLog(`=== enhancedLogout failed after ${duration}ms ===`, 'error');
    debugLog(`Error: ${error.message}`, 'error');
    debugLog(`Stack: ${error.stack}`, 'error');
  }
}

// Utility function to check logout state
export async function checkLogoutState() {
  try {
    const userData = await AsyncStorage.getItem('user');
    const welcomeFlag = await AsyncStorage.getItem('hasSeenWelcome');
    
    debugLog('=== Logout State Check ===', 'header');
    debugLog(`User data: ${userData ? 'exists' : 'null'}`, 'info');
    debugLog(`Welcome flag: ${welcomeFlag || 'not set'}`, 'info');
    
    return {
      hasUser: !!userData,
      hasWelcomeFlag: !!welcomeFlag,
      userData: userData ? JSON.parse(userData) : null,
      welcomeFlag
    };
  } catch (error) {
    debugLog(`Error checking logout state: ${error.message}`, 'error');
    return null;
  }
} 