import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../utils/routes';

export default function BottomNavAdmin({ activeRoute, onLogout }) {
  const adminNavItems = [
    { icon: 'home-outline', activeIcon: 'home', title: 'Dashboard', route: ROUTES.ADMIN.DASHBOARD },
    { icon: 'people-outline', activeIcon: 'people', title: 'Users', route: ROUTES.ADMIN.USER_MANAGEMENT },
    { icon: 'person-circle-outline', activeIcon: 'person-circle', title: 'Profile', route: '/users/admin/Profile' },
    { icon: 'log-out-outline', activeIcon: 'log-out', title: 'Logout', route: '/logout' },
  ];

  const handleNavigation = (route) => {
    if (router && route) {
      try {
        // If navigating to user management, set role filter to 'all'
        if (route === ROUTES.ADMIN.USER_MANAGEMENT) {
          router.push(`${route}?role=all`);
        } else {
          router.push(route);
        }
      } catch (error) {
        console.error('Admin navigation error:', error);
      }
    }
  };

  const handleLogoutPress = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const bottomNavStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 28,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  };

  const scrollToTopButtonStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100, // Adjust as needed to sit just above the nav bar
    alignItems: 'center',
    zIndex: 20,
  };

  return (
    <>
      {/* White background container to cover content below the nav bar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 60, // Reduced height to match reduced padding
        backgroundColor: '#FFFFFF',
        zIndex: 9,
      }} />
      <SafeAreaView edges={['bottom']} style={{backgroundColor: '#FFFFFF'}}>
        <View style={bottomNavStyle}>
          {adminNavItems.map((item, index) => {
            if (!item || !item.route) {
              return null;
            }
            
            const isActive = activeRoute === item.route;
            const isLogout = item.route === '/logout';
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.bottomNavItem}
                onPress={() => {
                  if (isLogout) {
                    handleLogoutPress();
                  } else {
                    handleNavigation(item.route);
                  }
                }}
              >
                <View>
                  <Ionicons
                    name={isActive && item.activeIcon ? item.activeIcon : item.icon}
                    size={24}
                    color={isActive ? '#DC2626' : '#6B7280'}
                  />
                </View>
                {/* Removed the Text label below the icon */}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
      {/* Example usage for scroll-to-top button: */}
      {/* <View style={scrollToTopButtonStyle}> */}
      {/*   <TouchableOpacity onPress={handleScrollToTop}> */}
      {/*     <Ionicons name="arrow-up" size={32} color="#374151" /> */}
      {/*   </TouchableOpacity> */}
      {/* </View> */}
    </>
  );
}

const styles = StyleSheet.create({
  bottomNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 32, // Increased for wider icon spacing
  },
  bottomNavText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  activeText: {
    color: '#DC2626',
  },
}); 