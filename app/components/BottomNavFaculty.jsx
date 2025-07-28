import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../utils/routes';

export default function BottomNavFaculty({ activeRoute, onLogout }) {
  const facultyNavItems = [
    { icon: 'home-outline', activeIcon: 'home', title: 'Dashboard', route: ROUTES.FACULTY.DASHBOARD },
    { icon: 'school-outline', activeIcon: 'school', title: 'Classes', route: ROUTES.FACULTY.MY_CLASSES },
    { icon: 'document-text-outline', activeIcon: 'document-text', title: 'Syllabus', route: ROUTES.FACULTY.MY_SYLLABI },
    { icon: 'person-outline', activeIcon: 'person', title: 'Profile', route: ROUTES.FACULTY.PROFILE },
    { icon: 'log-out-outline', activeIcon: 'log-out', title: 'Logout', route: '/logout' },
  ];

  const handleNavigation = (route) => {
    if (router && route) {
      try {
        router.push(route);
      } catch (error) {
        console.error('Faculty navigation error:', error);
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',

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
        <View style={styles.bottomNavBar}>
          {facultyNavItems.map((item, index) => {
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
                <Ionicons
                  name={isActive && item.activeIcon ? item.activeIcon : item.icon}
                  size={24}
                  color={isActive ? '#DC2626' : '#6B7280'}
                  style={styles.icon}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  bottomNavBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 0, // Reduced padding to be closer to phone navigation bar
    paddingHorizontal: 28, // Match staff/dean
    marginBottom: 0, // Reduced margin to be closer to phone navigation bar
    zIndex: 10,
  },
  bottomNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 32, // Match staff/dean spacing
  },
  icon: {
    marginBottom: 0,
  },
}); 