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
    // Ensure role is properly mapped from backend to frontend
    if (userData.role) {
      const mappedRole = mapBackendRoleToFrontend(userData.role);
      
      if (mappedRole !== userData.role) {
        userData.role = mappedRole;
      }
      
      // Validate that the role is a valid frontend role
      const isValidRole = isValidFrontendRole(userData.role);
      
      if (!isValidRole) {
        console.warn('[UserContext] Invalid role received:', userData.role);
      }
    } else {
      console.log('[UserContext] ⚠️  No role found in user data');
      console.log('[UserContext] ⚠️  This will cause navigation issues');
    }
    
    try {
      setLoginLoading(true);
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('[UserContext] Error saving user to storage:', error);
      setLoginLoading(false);
      return;
    }
    
    // Wait for initialization if not ready
    const waitForInit = async () => {
      if (!isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return waitForInit();
      }
      
      // Navigation after initialization
      setTimeout(() => {
        setLoginLoading(false);
        
        if (router) {
          try {
            let targetRoute;
            
            if (userData.role === UserRole.ADMIN) {
              targetRoute = ROUTES.ADMIN_DASHBOARD;
            } else if (userData.role === UserRole.STAFF) {
              targetRoute = ROUTES.STAFF_DASHBOARD;
            } else if (userData.role === UserRole.FACULTY) {
              targetRoute = ROUTES.FACULTY_DASHBOARD;
            } else if (userData.role === UserRole.DEAN) {
              targetRoute = ROUTES.DEAN_DASHBOARD;
            } else if (userData.role === UserRole.PROGRAM_CHAIR) {
              targetRoute = ROUTES.PROGRAM_CHAIR_DASHBOARD;
            } else {
              targetRoute = ROUTES.FACULTY_DASHBOARD; // Default fallback
            }
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