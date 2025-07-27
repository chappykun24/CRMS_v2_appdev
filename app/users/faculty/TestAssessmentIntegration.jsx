import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient from '../../../utils/api';

export default function TestAssessmentIntegration() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results = [];
    
    // Test 1: Syllabus assessments endpoint
    try {
      const response = await apiClient.get('/assessments/syllabus/1');
      results.push({
        name: 'Syllabus Assessments',
        status: '✅ PASSED',
        data: response.data,
        count: response.data.length
      });
    } catch (error) {
      results.push({
        name: 'Syllabus Assessments',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 2: Specific assessment endpoint
    try {
      const response = await apiClient.get('/assessments/1');
      results.push({
        name: 'Specific Assessment',
        status: '✅ PASSED',
        data: response.data,
        title: response.data.title
      });
    } catch (error) {
      results.push({
        name: 'Specific Assessment',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 3: Sub-assessments endpoint
    try {
      const response = await apiClient.get('/sub-assessments/assessment/1');
      results.push({
        name: 'Sub-Assessments',
        status: '✅ PASSED',
        data: response.data,
        count: response.data.length
      });
    } catch (error) {
      results.push({
        name: 'Sub-Assessments',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 4: ILOs endpoint
    try {
      const response = await apiClient.get('/ilos/syllabus/1');
      results.push({
        name: 'ILOs',
        status: '✅ PASSED',
        data: response.data,
        count: response.data.length
      });
    } catch (error) {
      results.push({
        name: 'ILOs',
        status: '❌ FAILED',
        error: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const renderTestResult = (result) => (
    <View key={result.name} style={styles.testCard}>
      <View style={styles.testHeader}>
        <Text style={styles.testName}>{result.name}</Text>
        <Text style={[
          styles.testStatus,
          { color: result.status.includes('PASSED') ? '#10B981' : '#EF4444' }
        ]}>
          {result.status}
        </Text>
      </View>
      
      {result.error ? (
        <Text style={styles.errorText}>Error: {result.error}</Text>
      ) : (
        <View style={styles.testDetails}>
          {result.count && (
            <Text style={styles.detailText}>Count: {result.count}</Text>
          )}
          {result.title && (
            <Text style={styles.detailText}>Title: {result.title}</Text>
          )}
          <Text style={styles.detailText}>Data received: {result.data ? 'Yes' : 'No'}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={24} color="#6B7280" />
          <Text style={styles.loadingText}>Running API tests...</Text>
        </View>
      </View>
    );
  }

  const passedTests = testResults.filter(r => r.status.includes('PASSED')).length;
  const totalTests = testResults.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frontend Integration Test</Text>
        <Text style={styles.headerSubtitle}>
          Testing API endpoints for assessment management
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Test Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passed:</Text>
          <Text style={styles.summaryValue}>{passedTests}/{totalTests}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Success Rate:</Text>
          <Text style={styles.summaryValue}>
            {totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%
          </Text>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results</Text>
        {testResults.map(renderTestResult)}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            runTests();
          }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Run Tests Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  testStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  testDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 