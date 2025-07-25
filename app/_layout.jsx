import { router, Stack, usePathname } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollProvider, useScrollContext } from '../contexts/ScrollContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import { UserRole } from '../types/userRoles';
import { initializeAPI, setAPIBaseURL } from '../utils/api';
import { exitApp } from '../utils/appExit';
import { ROUTES } from '../utils/routes';
import BottomNavAdmin from './components/BottomNavAdmin';
import BottomNavDean from './components/BottomNavDean';
import BottomNavFaculty from './components/BottomNavFaculty';
import BottomNavProgramChair from './components/BottomNavProgramChair';
import BottomNavStaff from './components/BottomNavStaff';
import GlobalHeader from './components/GlobalHeader';
import IPDetectionLoadingScreen from './components/IPDetectionLoadingScreen';
import LoginLoadingScreen from './components/LoginLoadingScreen';
import PublicBottomNav from './components/PublicBottomNav';

function AppContent() {
  const pathname = usePathname();
  const { isLoggedIn, currentUser, isLoading, loginLoading, logout, isInitialized } = useUser();
  const [ipDetection, setIPDetection] = React.useState({ loading: true, triedIPs: [], currentIP: '', status: '' });
  const [manualIPTesting, setManualIPTesting] = React.useState(false);

  // Handler for manual IP input
  const handleManualIPSubmit = async (ip) => {
    setManualIPTesting(true);
    setIPDetection(prev => ({ ...prev, status: `Testing manual IP: ${ip}`, currentIP: ip, triedIPs: [...prev.triedIPs, ip] }));
    try {
      const response = await fetch(`http://${ip}:3001/api/test`, { method: 'GET', timeout: 2000 });
      if (response.ok) {
        setAPIBaseURL(`http://${ip}:3001/api`);
        setIPDetection({ loading: false, triedIPs: [...ipDetection.triedIPs, ip], currentIP: ip, status: `Manual IP successful: ${ip}` });
        // Persist the last used IP in AsyncStorage
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
          AsyncStorage.setItem('API_BASE_URL', `http://${ip}:3001/api`);
        });
        initializeAPI().then((apiBaseURL) => {
          console.log('[Layout] 🚦 Detected API Base URL (manual):', apiBaseURL);
        });
        setManualIPTesting(false);
        return;
      } else {
        setIPDetection(prev => ({ ...prev, status: `Manual IP failed: ${ip}` }));
      }
    } catch (e) {
      setIPDetection(prev => ({ ...prev, status: `Manual IP failed: ${ip}` }));
    }
    setManualIPTesting(false);
  };
  
  // Check if we're on user management page
  const isUserManagementPage = pathname.includes('/users/admin/user-management');
  
  // Only use scroll context on user management page
  let headerTranslateY;
  try {
    const scrollContext = useScrollContext();
    headerTranslateY = isUserManagementPage ? scrollContext.headerTranslateY : undefined;
  } catch (error) {
    // If scroll context is not available, use undefined (no animation)
    headerTranslateY = undefined;
  }
  
  // Remove automatic detection: Only show manual input
  React.useEffect(() => {
    setIPDetection({ loading: true, triedIPs: [], currentIP: '', status: 'Please enter your backend IP address below.' });
  }, []);
  
  // Minimal logging for debugging
  if (__DEV__) {
    console.log('[Layout] pathname:', pathname, 'isLoggedIn:', isLoggedIn, 'role:', currentUser?.role);
  }
  
  // Normalize pathname to ensure consistent matching
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  
  // Simplified logic - show header and nav on all pages except welcome and authenticated user pages
  const isWelcomePage = normalizedPathname === ROUTES.WELCOME || normalizedPathname === '/welcome';
  const isAuthenticatedPage = normalizedPathname.startsWith('/users') || normalizedPathname.startsWith('/pages');
  const isAdminDashboard = normalizedPathname === ROUTES.ADMIN_DASHBOARD;
  
  // Handle logout - UserContext now handles navigation
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => null,
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('[Layout] User confirmed logout');
            await logout();
          },
        },
      ]
    );
  };

  // Render role-specific bottom navigation
  const renderBottomNav = () => {
    if (isWelcomePage) {
      return null;
    }
    
    // For authenticated users with roles, render role-specific navigation
    if (isLoggedIn && currentUser?.role) {
      const commonProps = {
        activeRoute: normalizedPathname,
        onLogout: handleLogout
      };

      switch (currentUser.role) {
        case UserRole.ADMIN:
          return <BottomNavAdmin {...commonProps} />;
        case UserRole.DEAN:
          return <BottomNavDean {...commonProps} />;
        case UserRole.FACULTY:
          return <BottomNavFaculty {...commonProps} />;
        case UserRole.PROGRAM_CHAIR:
          return <BottomNavProgramChair {...commonProps} />;
        case UserRole.STAFF:
          return <BottomNavStaff {...commonProps} />;
        default:
          console.log('MainLayout - Unknown role, not showing nav');
          return null;
      }
    }
    
    // For public pages, render public navigation
    console.log('MainLayout - Showing public nav');
    return <PublicBottomNav activeRoute={normalizedPathname} />;
  };

  // Handle hardware back button
  React.useEffect(() => {
    const backAction = () => {
      // If we're on the welcome page, allow normal back navigation
      if (isWelcomePage) {
        return false; // Allow default back behavior
      }
      
      // If we're on a public page (not logged in), allow normal back navigation
      if (!isLoggedIn) {
        return false; // Allow default back behavior
      }
      
      // If we're logged in and on any authenticated page, show quit confirmation
      Alert.alert(
        'Exit App',
        'Are you sure you want to exit the application?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => null,
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              // Use the utility function for better error handling and fallbacks
              exitApp();
            },
          },
        ]
      );
      
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isLoggedIn, isWelcomePage]);

  // useEffect must be before any return!
  React.useEffect(() => {
    // Don't redirect if user is in the process of logging in
    if (loginLoading) {
      return;
    }
    
    // Only redirect if we're not on a public page, not logged in, and app is initialized
    if (!isLoggedIn && isInitialized && !normalizedPathname.startsWith('/public') && !isWelcomePage) {
      router.replace(ROUTES.PUBLIC);
    }
  }, [isLoggedIn, isInitialized, normalizedPathname, isWelcomePage, loginLoading]);
  
  // Show login loading screen when loginLoading is true
  if (loginLoading) {
    return <LoginLoadingScreen />;
  }

  // Show loading screen while app is initializing
  if (!isInitialized || isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  // Only show IP detection screen during initial app startup, not after login
  if (ipDetection.loading && !isLoggedIn) {
    return <IPDetectionLoadingScreen triedIPs={[]} currentIP={''} status={ipDetection.status} onManualIPSubmit={handleManualIPSubmit} />;
  }
  
  // For logged-in users, wrap with SafeAreaView and make scrollable
  if (isLoggedIn) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView 
          style={{ flex: 1, backgroundColor: 'transparent' }}
          contentContainerStyle={{ flexGrow: 1, backgroundColor: 'transparent' }}
          showsVerticalScrollIndicator={false}
        >
          {/* Always show the Stack to prevent content from disappearing */}
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#DC2626',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerShown: false,
            }}
          />
        </ScrollView>
        
        {/* Show bottom navigation */}
        {renderBottomNav()}
      </SafeAreaView>
    );
  }
  
  // For public pages, use regular View with GlobalHeader and make scrollable
  return (
    <View style={{ flex: 1 }}>
      {/* Show header only on public pages when not logged in */}
      {!isWelcomePage && !isLoggedIn && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999 }}>
          <GlobalHeader headerTranslateY={undefined} />
        </View>
      )}
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Always show the Stack to prevent content from disappearing */}
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#DC2626',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShown: false,
            contentStyle: {
              paddingTop: (!isWelcomePage && !isLoggedIn) ? 100 : 0, // Add top padding only when GlobalHeader is shown
              backgroundColor: 'transparent', // Make sure background is transparent
            },
          }}
        />
      </ScrollView>
      
      {/* Show bottom navigation */}
      {renderBottomNav()}
    </View>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <ScrollProvider>
        <AppContent />
      </ScrollProvider>
    </UserProvider>
  );
} 