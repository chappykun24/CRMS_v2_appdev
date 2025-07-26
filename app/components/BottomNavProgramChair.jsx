import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../utils/routes';

export default function BottomNavProgramChair({ activeRoute, onLogout }) {
  const programChairNavItems = [
    { icon: 'home-outline', activeIcon: 'home', title: 'Dashboard', route: ROUTES.PROGRAM_CHAIR.DASHBOARD },
    { icon: 'school-outline', activeIcon: 'school', title: 'Courses', route: ROUTES.PROGRAM_CHAIR.COURSE_MANAGEMENT },
    { icon: 'document-text-outline', activeIcon: 'document-text', title: 'Submissions', route: ROUTES.PROGRAM_CHAIR.REVIEW_SUBMISSIONS },
    { icon: 'person-circle-outline', activeIcon: 'person-circle', title: 'Profile', route: ROUTES.PROGRAM_CHAIR.MY_PROFILE },
    { icon: 'log-out-outline', activeIcon: 'log-out', title: 'Logout', route: '/logout' },
  ];

  const handleNavigation = (route) => {
    if (router && route) {
      try {
        router.push(route);
      } catch (error) {
        console.error('Program Chair navigation error:', error);
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
    paddingVertical: 0, // Reduced padding to be closer to phone navigation bar
    paddingHorizontal: 28,
    marginBottom: 0, // Reduced margin to be closer to phone navigation bar
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
          {programChairNavItems.map((item, index) => {
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