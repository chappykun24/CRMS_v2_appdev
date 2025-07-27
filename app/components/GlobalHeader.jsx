import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GlobalHeader({ headerTranslateY }) {
  const handleLogoPress = async () => {
    Alert.alert(
      'Reset Welcome Screen',
      'Do you want to reset the welcome screen? This will take you back to the welcome screen.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear the welcome screen flag
              await AsyncStorage.removeItem('hasSeenWelcome');
              // Navigate to welcome screen
              router.push('/welcome');
            } catch (error) {
              console.error('Error resetting welcome screen:', error);
            }
          },
        },
      ]
    );
  };

  const headerStyle = headerTranslateY 
    ? [styles.header, { transform: [{ translateY: headerTranslateY }] }]
    : styles.header;

  return (
    <Animated.View style={headerStyle}>
      <View style={styles.headerContent}>
        <View style={styles.centerContent}>
          <TouchableOpacity style={styles.logoContainer} onPress={handleLogoPress}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Class Record Management</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginTop: 0, // Remove top margin to position at top
    zIndex: 9999, // High z-index to ensure visibility
    elevation: 0, // Remove elevation for Android
    shadowColor: 'transparent', // Remove shadow for iOS
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginLeft: 8,
  },
}); 