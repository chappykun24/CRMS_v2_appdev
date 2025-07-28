import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoleBasedBottomNav({ items, activeRoute, onLogout }) {
  const handleNavigation = (route) => {
    if (router && route) {
      try {
        router.push(route);
      } catch (error) {
        console.error('Role-based navigation error:', error);
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

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={bottomNavStyle}>
      {items.map((item, index) => {
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