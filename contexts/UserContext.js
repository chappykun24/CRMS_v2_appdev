import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { hasPermission as checkPermission, UserRole } from '../types/userRoles';
import { getAPIBaseURL } from '../utils/api';
import { isValidFrontendRole, mapBackendRoleToFrontend } from '../utils/roleMapping';
import { ROUTES } from '../utils/routes';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiBaseURL, setAPIBaseURL] = React.useState(getAPIBaseURL());
  const [apiConnected, setAPIConnected] = React.useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // Listen for API base URL changes
  React.useEffect(() => {
    // Listen for changes in API base URL and connection status
    const updateAPIStatus = () => {
      setAPIBaseURL(getAPIBaseURL());
      // Optionally, you can add logic to test connection and update apiConnected
    };
    // You can hook this into your networkManager or API logic if needed
    // For now, just update on mount
    updateAPIStatus();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      // Ensure loading state is set to false
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (userData) => {
    console.log('[UserContext] === Starting login process ===');
    console.log('[UserContext] User data:', userData);
    console.log('[UserContext] User role:', userData.role);
    console.log('[UserContext] User role type:', typeof userData.role);
    console.log('[UserContext] Current state - user:', user);
    console.log('[UserContext] Current state - isLoading:', isLoading);
    console.log('[UserContext] Current state - isInitialized:', isInitialized);
    console.log('[UserContext] Current state - loginLoading:', loginLoading);
    
    debugger; // Debug point 1: UserContext login started
    
    // Ensure role is properly mapped from backend to frontend
    if (userData.role) {
      console.log('[UserContext] 🎭 Processing role mapping...');
      console.log('[UserContext] 🎭 Original role:', userData.role);
      
      debugger; // Debug point 2: Before role mapping
      
      const mappedRole = mapBackendRoleToFrontend(userData.role);
      console.log('[UserContext] 🎭 Mapped role:', mappedRole);
      console.log('[UserContext] 🎭 Role mapping function result:', mappedRole);
      
      if (mappedRole !== userData.role) {
        console.log('[UserContext] ✅ Role mapped from backend:', userData.role, 'to frontend:', mappedRole);
        userData.role = mappedRole;
      } else {
        console.log('[UserContext] ℹ️  No role mapping needed');
      }
      
      debugger; // Debug point 3: After role mapping
      
      // Validate that the role is a valid frontend role
      const isValidRole = isValidFrontendRole(userData.role);
      console.log('[UserContext] 🎭 Role validation result:', isValidRole);
      console.log('[UserContext] 🎭 Role validation function result:', isValidRole);
      
      if (!isValidRole) {
        console.warn('[UserContext] ⚠️  Invalid role received:', userData.role);
        console.warn('[UserContext] ⚠️  This may cause navigation issues');
        // You might want to handle this case differently based on your requirements
      }
    } else {
      console.log('[UserContext] ⚠️  No role found in user data');
      console.log('[UserContext] ⚠️  This will cause navigation issues');
    }
    
    try {
      console.log('[UserContext] 💾 Saving user to state and storage...');
      console.log('[UserContext] 💾 About to set loginLoading to true');
      
      debugger; // Debug point 4: Before saving user
      
      setLoginLoading(true);
      console.log('[UserContext] 💾 loginLoading set to true');
      
      setUser(userData);
      console.log('[UserContext] 💾 User state updated');
      
      console.log('[UserContext] 💾 About to save to AsyncStorage...');
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      console.log('[UserContext] 💾 AsyncStorage save completed');
      
      debugger; // Debug point 5: After saving user
      
      console.log('[UserContext] ✅ User saved to storage successfully');
      console.log('[UserContext] 💾 User data saved:', JSON.stringify(userData, null, 2));
      
      // Verify storage was successful
      const savedUser = await AsyncStorage.getItem('user');
      console.log('[UserContext] 💾 Verification - User in storage:', savedUser ? 'exists' : 'null');
      
    } catch (error) {
      debugger; // Debug point 6: Error saving user
      
      console.error('[UserContext] ❌ Error saving user to storage:', error);
      console.error('[UserContext] ❌ Error stack:', error.stack);
      setLoginLoading(false); // Reset loading state on error
      console.log('[UserContext] ❌ loginLoading reset to false due to error');
      return;
    }
    
    // Wait for initialization if not ready
    const waitForInit = async () => {
      console.log('[UserContext] ⏳ Checking initialization status...');
      console.log('[UserContext] ⏳ isInitialized:', isInitialized);
      
      if (!isInitialized) {
        console.log('[UserContext] ⏳ Waiting for initialization...');
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('[UserContext] ⏳ After 100ms delay, checking again...');
        return waitForInit();
      }
      
      console.log('[UserContext] ✅ Initialization complete, proceeding to navigation');
      
      debugger; // Debug point 7: Before navigation
      
      // Navigation after initialization
      console.log('[UserContext] 🚀 About to start navigation timeout...');
      setTimeout(() => {
        console.log('[UserContext] 🚀 Navigation timeout triggered');
        console.log('[UserContext] 🚀 Starting navigation process...');
        console.log('[UserContext] 🚀 About to set loginLoading to false');
        
        setLoginLoading(false);
        console.log('[UserContext] 🚀 loginLoading set to false');
        
        console.log('[UserContext] 📱 Attempting navigation after login');
        console.log('[UserContext] 📱 Router available:', !!router);
        console.log('[UserContext] 📱 Router type:', typeof router);
        console.log('[UserContext] 🎭 User role for navigation:', userData.role);
        console.log('[UserContext] 🎭 User data at navigation time:', userData);
        
        if (router) {
          console.log('[UserContext] 📱 Router is available, proceeding with navigation');
          try {
            let targetRoute;
            console.log('[UserContext] 🎯 Determining target route...');
            console.log('[UserContext] 🎯 UserRole constants:');
            console.log('[UserContext] 🎯 UserRole.ADMIN:', UserRole.ADMIN);
            console.log('[UserContext] 🎯 UserRole.STAFF:', UserRole.STAFF);
            console.log('[UserContext] 🎯 UserRole.FACULTY:', UserRole.FACULTY);
            console.log('[UserContext] 🎯 UserRole.DEAN:', UserRole.DEAN);
            console.log('[UserContext] 🎯 UserRole.PROGRAM_CHAIR:', UserRole.PROGRAM_CHAIR);
            
            if (userData.role === UserRole.ADMIN) {
              targetRoute = ROUTES.ADMIN_DASHBOARD;
              console.log('[UserContext] 🎯 Admin route selected');
            } else if (userData.role === UserRole.STAFF) {
              targetRoute = ROUTES.STAFF_DASHBOARD;
              console.log('[UserContext] 🎯 Staff route selected');
            } else if (userData.role === UserRole.FACULTY) {
              targetRoute = ROUTES.FACULTY_DASHBOARD;
              console.log('[UserContext] 🎯 Faculty route selected');
            } else if (userData.role === UserRole.DEAN) {
              targetRoute = ROUTES.DEAN_DASHBOARD;
              console.log('[UserContext] 🎯 Dean route selected');
            } else if (userData.role === UserRole.PROGRAM_CHAIR) {
              targetRoute = ROUTES.PROGRAM_CHAIR_DASHBOARD;
              console.log('[UserContext] 🎯 Program Chair route selected');
            } else {
              targetRoute = ROUTES.FACULTY_DASHBOARD; // Default fallback
              console.log('[UserContext] 🎯 Default route selected (fallback)');
              console.log('[UserContext] 🎯 This may indicate a role mapping issue');
            }
            
            console.log('[UserContext] 🎯 Target route:', targetRoute);
            console.log('[UserContext] 🎯 ROUTES object:', ROUTES);
            
            debugger; // Debug point 8: Before router navigation
            
            console.log('[UserContext] 🚀 About to call router.replace with:', targetRoute);
            router.replace(targetRoute);
            console.log('[UserContext] ✅ Navigation command executed successfully');
            console.log('[UserContext] ✅ router.replace() called without throwing error');
            
          } catch (navigationError) {
            debugger; // Debug point 9: Navigation error
            
            console.error('[UserContext] ❌ Navigation error during login:', navigationError);
            console.error('[UserContext] ❌ Navigation error stack:', navigationError.stack);
            console.error('[UserContext] ❌ Navigation error type:', navigationError.constructor.name);
            console.error('[UserContext] ❌ Navigation error message:', navigationError.message);
          }
        } else {
          console.log('[UserContext] ⚠️  No router available for navigation');
          console.log('[UserContext] ⚠️  Router value:', router);
          console.log('[UserContext] ⚠️  Router type:', typeof router);
        }
        
        console.log('[UserContext] 🚀 Navigation process completed');
      }, 1200);
      
      console.log('[UserContext] 🚀 Navigation timeout scheduled for 1200ms');
    };
    
    console.log('[UserContext] 🚀 About to call waitForInit...');
    waitForInit();
    console.log('[UserContext] 🚀 waitForInit called, login function ending');
  };

  const logout = async () => {
    console.log('[UserContext] === Starting logout process ===');
    const startTime = Date.now();
    
    try {
      console.log('[UserContext] Step 1: Setting loginLoading to false');
      setLoginLoading(false);
      
      console.log('[UserContext] Step 2: Checking current user state');
      console.log('[UserContext] Current user:', user);
      console.log('[UserContext] isLoggedIn:', !!user);
      
      console.log('[UserContext] Step 3: Removing user from AsyncStorage');
      await AsyncStorage.removeItem('user');
      console.log('[UserContext] User removed from AsyncStorage successfully');
      
      console.log('[UserContext] Step 4: Updating state');
      setUser(null);
      setIsLoading(false);
      console.log('[UserContext] State updated - user: null, isLoading: false');
      
      // Verify storage was cleared
      const userDataAfter = await AsyncStorage.getItem('user');
      console.log('[UserContext] Verification - User data after removal:', userDataAfter ? 'still exists' : 'null');
      
      // Add a small delay to ensure state updates properly
      console.log('[UserContext] Step 5: Waiting 100ms before navigation');
      setTimeout(() => {
        console.log('[UserContext] Step 6: Attempting navigation');
        console.log('[UserContext] Router available:', !!router);
        console.log('[UserContext] Target route:', ROUTES.PUBLIC);
        
        // Explicitly navigate to home page after logout
        if (router) {
          try {
            console.log('[UserContext] Calling router.replace(ROUTES.PUBLIC)');
            router.replace(ROUTES.PUBLIC);
            console.log('[UserContext] Navigation command executed successfully');
          } catch (navigationError) {
            console.error('[UserContext] Navigation error during logout:', navigationError);
            console.error('[UserContext] Navigation error stack:', navigationError.stack);
          }
        } else {
          console.log('[UserContext] No router available for navigation');
        }
      }, 100);
      
      const duration = Date.now() - startTime;
      console.log(`[UserContext] === Logout completed successfully in ${duration}ms ===`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[UserContext] === Logout failed after ${duration}ms ===`);
      console.error('[UserContext] Error during logout:', error);
      console.error('[UserContext] Error stack:', error.stack);
      
      // Reset state even if there was an error
      setUser(null);
      setIsLoading(false);
      console.log('[UserContext] State reset after error');
      
      // Still try to navigate even if there was an error
      setTimeout(() => {
        console.log('[UserContext] Attempting fallback navigation after error');
        if (router) {
          try {
            console.log('[UserContext] Calling router.replace(ROUTES.PUBLIC) (fallback)');
            router.replace(ROUTES.PUBLIC);
            console.log('[UserContext] Fallback navigation successful');
          } catch (navigationError) {
            console.error('[UserContext] Navigation error during logout fallback:', navigationError);
            console.error('[UserContext] Fallback navigation error stack:', navigationError.stack);
          }
        } else {
          console.log('[UserContext] No router available for fallback navigation');
        }
      }, 100);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error) {
      console.error('Error updating user in storage:', error);
    }
  };

  // Wrapper function for hasPermission that uses current user
  const hasPermission = (permission) => {
    if (!user) return false;
    return checkPermission(user, permission);
  };

  const value = {
    user,
    currentUser: user,
    isLoading,
    loginLoading,
    isLoggedIn: !!user,
    isInitialized,
    login,
    logout,
    updateUser,
    hasPermission,
    apiBaseURL,
    apiConnected,
    setAPIBaseURL,
    setAPIConnected,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 