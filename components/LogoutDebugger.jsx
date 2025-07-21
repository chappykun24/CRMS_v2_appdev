import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

const LogoutDebugger = ({ visible = false, onClose }) => {
  const [debugLog, setDebugLog] = useState([]);
  const [currentStep, setCurrentStep] = useState('');
  const [userState, setUserState] = useState(null);
  const [storageState, setStorageState] = useState(null);
  const { user, isLoggedIn, isLoading } = useUser();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now(),
      timestamp,
      message,
      type,
    };
    setDebugLog(prev => [...prev, logEntry]);
    console.log(`[LogoutDebugger] ${message}`);
  };

  const checkStorageState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      setStorageState({
        user: userData ? JSON.parse(userData) : null,
        hasSeenWelcome,
      });
      addLog(`Storage state - User: ${userData ? 'exists' : 'null'}, Welcome: ${hasSeenWelcome}`, 'info');
    } catch (error) {
      addLog(`Error checking storage: ${error.message}`, 'error');
    }
  };

  const simulateLogout = async () => {
    addLog('=== Starting Logout Simulation ===', 'header');
    setCurrentStep('Starting logout process');
    
    // Step 1: Check initial state
    addLog('Step 1: Checking initial state', 'step');
    addLog(`Current user: ${user ? JSON.stringify(user) : 'null'}`, 'info');
    addLog(`isLoggedIn: ${isLoggedIn}`, 'info');
    addLog(`isLoading: ${isLoading}`, 'info');
    await checkStorageState();
    
    // Step 2: Simulate logout function
    setCurrentStep('Executing logout function');
    addLog('Step 2: Executing logout function', 'step');
    
    try {
      // Simulate the logout process from UserContext
      addLog('Setting loginLoading to false', 'info');
      addLog('Removing user from AsyncStorage', 'info');
      await AsyncStorage.removeItem('user');
      addLog('User removed from AsyncStorage successfully', 'success');
      
      addLog('Setting user state to null', 'info');
      addLog('Setting isLoading to false', 'info');
      
      // Check storage after removal
      await checkStorageState();
      
      // Step 3: Navigation attempt
      setCurrentStep('Attempting navigation');
      addLog('Step 3: Attempting navigation', 'step');
      addLog('Waiting 100ms before navigation...', 'info');
      
      setTimeout(async () => {
        try {
          addLog('Attempting to navigate to /public', 'info');
          addLog(`Router available: ${!!router}`, 'info');
          
          if (router) {
            addLog('Router is available, calling router.replace("/public")', 'info');
            router.replace('/public');
            addLog('Navigation command executed successfully', 'success');
          } else {
            addLog('Router is not available', 'error');
          }
        } catch (navigationError) {
          addLog(`Navigation error: ${navigationError.message}`, 'error');
        }
        
        // Final state check
        setCurrentStep('Final state check');
        addLog('Step 4: Final state check', 'step');
        await checkStorageState();
        addLog('=== Logout Simulation Complete ===', 'header');
      }, 100);
      
    } catch (error) {
      addLog(`Error during logout simulation: ${error.message}`, 'error');
      setCurrentStep('Error occurred');
    }
  };

  const clearLog = () => {
    setDebugLog([]);
    setCurrentStep('');
  };

  useEffect(() => {
    if (visible) {
      addLog('LogoutDebugger mounted', 'info');
      checkStorageState();
    }
  }, [visible]);

  useEffect(() => {
    setUserState({
      user,
      isLoggedIn,
      isLoading,
    });
  }, [user, isLoggedIn, isLoading]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Logout Debugger</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={simulateLogout} style={styles.button}>
          <Text style={styles.buttonText}>Simulate Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearLog} style={styles.button}>
          <Text style={styles.buttonText}>Clear Log</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={checkStorageState} style={styles.button}>
          <Text style={styles.buttonText}>Check Storage</Text>
        </TouchableOpacity>
      </View>

      {currentStep && (
        <View style={styles.currentStep}>
          <Text style={styles.currentStepText}>Current Step: {currentStep}</Text>
        </View>
      )}

      <View style={styles.stateSection}>
        <Text style={styles.sectionTitle}>Current State:</Text>
        <Text style={styles.stateText}>
          User: {userState?.user ? 'Logged In' : 'Not Logged In'}
        </Text>
        <Text style={styles.stateText}>
          isLoggedIn: {userState?.isLoggedIn ? 'true' : 'false'}
        </Text>
        <Text style={styles.stateText}>
          isLoading: {userState?.isLoading ? 'true' : 'false'}
        </Text>
      </View>

      <View style={styles.stateSection}>
        <Text style={styles.sectionTitle}>Storage State:</Text>
        <Text style={styles.stateText}>
          User Data: {storageState?.user ? 'Exists' : 'Null'}
        </Text>
        <Text style={styles.stateText}>
          Welcome Flag: {storageState?.hasSeenWelcome || 'Not Set'}
        </Text>
      </View>

      <ScrollView style={styles.logContainer}>
        <Text style={styles.sectionTitle}>Debug Log:</Text>
        {debugLog.map((log) => (
          <View key={log.id} style={[styles.logEntry, styles[`log${log.type}`]]}>
            <Text style={styles.logTimestamp}>{log.timestamp}</Text>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  currentStep: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  currentStepText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stateSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stateText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    padding: 10,
  },
  logEntry: {
    flexDirection: 'row',
    marginBottom: 5,
    padding: 5,
    borderRadius: 3,
  },
  loginfo: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  logsuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  logerror: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  logstep: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  logheader: {
    backgroundColor: 'rgba(175, 82, 222, 0.2)',
  },
  logTimestamp: {
    color: '#FF9500',
    fontSize: 12,
    marginRight: 10,
    minWidth: 80,
  },
  logMessage: {
    color: 'white',
    fontSize: 12,
    flex: 1,
  },
});

export default LogoutDebugger; 