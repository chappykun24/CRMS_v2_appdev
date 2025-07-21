import { usePathname } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { ROUTES } from '../../utils/routes';

function DebugInfo() {
  const pathname = usePathname();
  const { isLoggedIn, currentUser, isLoading, isInitialized, apiBaseURL, apiConnected } = useUser();
  
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const isWelcomePage = normalizedPathname === ROUTES.WELCOME || normalizedPathname === '/welcome';
  
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>Pathname: {pathname}</Text>
      <Text style={styles.debugText}>Normalized: {normalizedPathname}</Text>
      <Text style={styles.debugText}>Is Welcome Page: {isWelcomePage ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>Is Logged In: {isLoggedIn ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>Is Loading: {isLoading ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>Is Initialized: {isInitialized ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>User Role: {currentUser?.role || 'None'}</Text>
      <Text style={styles.debugText}>Should Show Header: {!isWelcomePage ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>Should Show Bottom Nav: {!isWelcomePage ? 'Yes' : 'No'}</Text>
      <Text style={styles.debugText}>API Base URL: {apiBaseURL}</Text>
      <Text style={styles.debugText}>API Connected: {apiConnected ? 'Yes' : 'No'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default DebugInfo; 