import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -2px 4px rgba(0,0,0,0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
    elevation: 3,
    zIndex: 10,
  };

  return (
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
            <Text style={[
              styles.bottomNavText,
              isActive && styles.activeText
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 20,
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