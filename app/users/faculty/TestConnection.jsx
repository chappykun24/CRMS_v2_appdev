import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient from '../../../utils/api';

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('Testing...');
    const results = [];

    try {
      // Test 1: Basic connection
      console.log('Testing API base URL:', apiClient.getBaseURL());
      results.push({
        name: 'API Base URL',
        status: '✅ PASSED',
        details: apiClient.getBaseURL()
      });

      // Test 2: Simple endpoint
      const response = await apiClient.get('/assessments/test');
      results.push({
        name: 'Basic API Call',
        status: '✅ PASSED',
        details: response.message || 'Response received'
      });

      // Test 3: Syllabus endpoint
      const syllabusResponse = await apiClient.get('/syllabus/one/1');
      results.push({
        name: 'Syllabus API',
        status: '✅ PASSED',
        details: `Syllabus: ${syllabusResponse.title || syllabusResponse.course_title || 'Found'}`
      });

      // Test 4: Assessments endpoint
      const assessmentsResponse = await apiClient.get('/assessments/syllabus/1');
      results.push({
        name: 'Assessments API',
        status: '✅ PASSED',
        details: `${assessmentsResponse.length} assessments found`
      });

      setConnectionStatus('✅ Connected Successfully');
    } catch (error) {
      console.error('Connection test failed:', error);
      results.push({
        name: 'Connection Test',
        status: '❌ FAILED',
        details: error.message
      });
      setConnectionStatus('❌ Connection Failed');
    }

    setTestResults(results);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Connection Test</Text>
        <Text style={styles.subtitle}>Testing connection to localhost:3001</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Connection Status</Text>
        <Text style={[
          styles.statusText,
          { color: connectionStatus.includes('✅') ? '#10B981' : '#EF4444' }
        ]}>
          {connectionStatus}
        </Text>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results</Text>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={[
                styles.resultStatus,
                { color: result.status.includes('✅') ? '#10B981' : '#EF4444' }
              ]}>
                {result.status}
              </Text>
            </View>
            <Text style={styles.resultDetails}>{result.details}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.retryButton}
        onPress={testConnection}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Test Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 