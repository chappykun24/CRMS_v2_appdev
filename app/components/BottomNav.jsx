import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../../utils/routes';

// Default navigation items for public pages
export const defaultBottomNavItems = [
  { icon: 'home-outline', activeIcon: 'home', title: 'Home', route: ROUTES.PUBLIC },
  { icon: 'log-in-outline', activeIcon: 'log-in', title: 'Login', route: ROUTES.LOGIN },
  { icon: 'help-circle-outline', activeIcon: 'help-circle', title: 'Help', route: ROUTES.HELP },
];

// Generalized navigation handler
export const defaultHandleNavigation = (route) => {
  // Use the route directly since it's already the full path
  if (router && route) {
    try {
      router.push(route);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }
};

/**
 * BottomNav Component
 * @param {Array} items - Array of nav items: { icon, activeIcon, title, route }
 * @param {Function} onNavigate - Function to call with route when item is pressed
 * @param {String} activeRoute - The current active route (optional, for highlighting)
 * @param {Function} onLogout - Function to call when logout is pressed
 */
export default function BottomNav({ items, onNavigate, activeRoute, onLogout }) {
  const navItems = items || defaultBottomNavItems;
  const handleNav = onNavigate || defaultHandleNavigation;
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
  const activeNavStyle = {
  };
  return (
    <View style={bottomNavStyle}>
      {navItems.map((item, index) => {
        // Skip items without valid routes
        if (!item || !item.route) {
          return null;
        }
        
        const isActive = activeRoute === item.route || 
                          (typeof item.route === 'string' && activeRoute === item.route.replace('/index', '')) ||
                          (activeRoute === '/' && item.route === ROUTES.PUBLIC);
        const isLogin = item.route === ROUTES.LOGIN;
        return (
          <TouchableOpacity
            key={index}
            style={[styles.bottomNavItem, isLogin && styles.loginNavItem]}
            onPress={() => {
              if (item.route === '/logout' && onLogout) {
                onLogout();
              } else {
                handleNav(item.route);
              }
            }}
          >
            {isLogin ? (
              <View style={styles.loginContentWrapper}>
                <Ionicons
                  name={isActive && item.activeIcon ? item.activeIcon : item.icon}
                  size={36}
                  color={'#FFFFFF'}
                />
                <Text style={styles.loginNavText}>{item.title}</Text>
              </View>
            ) : (
              <>
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
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
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
  },
  bottomNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  loginNavItem: {
    backgroundColor: '#DC2626',
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  loginNavText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 6,
    fontSize: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  activeText: {
    color: '#DC2626',
  },
}); 