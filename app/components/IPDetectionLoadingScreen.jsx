import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function IPDetectionLoadingScreen({ triedIPs = [], currentIP = '', status = '', onManualIPSubmit }) {
  const [manualIP, setManualIP] = useState('');
  const [error, setError] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);
  const scrollViewRef = useRef();

  // On mount, load the last used IP from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('API_BASE_URL').then((url) => {
      if (url) {
        // Extract just the IP address from the URL
        const match = url.match(/^http:\/\/(.*?):\d+/);
        if (match && match[1]) {
          setManualIP(match[1]);
        }
      }
    });
  }, []);

  // Update console log when status changes
  useEffect(() => {
    if (status) {
      setConsoleLogs((prev) => [...prev, status]);
    }
  }, [status]);

  const handleManualSubmit = () => {
    if (!manualIP.match(/^\d{1,3}(\.\d{1,3}){3}$/)) {
      setError('Please enter a valid IPv4 address');
      return;
    }
    setError('');
    if (onManualIPSubmit) onManualIPSubmit(manualIP);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.content}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <ActivityIndicator size="large" color="#DC2626" style={styles.spinner} />
            <Text style={styles.loadingText}>Detecting API Server...</Text>
            <Text style={styles.subText}>{status || 'Trying to find a working IP address for the backend...'}</Text>
            {/* Remove the IPs Tried section */}
            {/* <View style={styles.ipListContainer}>
              <Text style={styles.ipListTitle}>IPs Tried:</Text>
              <FlatList
                data={triedIPs}
                keyExtractor={(item, idx) => item + idx}
                renderItem={({ item }) => (
                  <Text style={[styles.ipItem, item === currentIP && styles.currentIP]}>{item}{item === currentIP ? ' (testing...)' : ''}</Text>
                )}
                style={styles.ipList}
                scrollEnabled={false}
              />
            </View> */}
            <View style={styles.consoleLogContainer}>
              <Text style={styles.consoleLogTitle}>Console Log:</Text>
              <ScrollView
                style={styles.consoleLog}
                ref={scrollViewRef}
                onContentSizeChange={() => scrollViewRef.current && scrollViewRef.current.scrollToEnd({ animated: true })}
              >
                {consoleLogs.map((log, idx) => (
                  <Text key={idx} style={styles.consoleLogText}>{log}</Text>
                ))}
              </ScrollView>
            </View>
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualLabel}>Or enter your laptop's IP address:</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 192.168.1.110"
                value={manualIP}
                onChangeText={setManualIP}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity style={styles.button} onPress={handleManualSubmit}>
                <Text style={styles.buttonText}>Try This IP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ipListContainer: {
    marginTop: 12,
    width: 220,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
  },
  ipListTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
  },
  ipList: {
    maxHeight: 100,
  },
  ipItem: {
    fontSize: 13,
    color: '#374151',
    paddingVertical: 2,
  },
  currentIP: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  consoleLogContainer: {
    marginTop: 18,
    width: 260,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    maxHeight: 120,
  },
  consoleLogTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  consoleLog: {
    maxHeight: 80,
  },
  consoleLogText: {
    color: '#d1d5db',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  manualInputContainer: {
    marginTop: 24,
    width: 220,
    alignItems: 'center',
  },
  manualLabel: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  error: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 2,
  },
}); 