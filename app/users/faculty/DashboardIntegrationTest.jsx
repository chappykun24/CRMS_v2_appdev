import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient from '../../../utils/api';

export default function DashboardIntegrationTest() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0
  });

  useEffect(() => {
    runAllTests();
  }, []);

  const runAllTests = async () => {
    setLoading(true);
    const results = [];
    
    // Test 1: Syllabus endpoints
    try {
      const response = await apiClient.get('/syllabus/one/1');
      results.push({
        category: 'Syllabus Management',
        name: 'Get Syllabus Details',
        status: '✅ PASSED',
        data: response.data,
        details: `Syllabus: ${response.data.title || response.data.course_title}`
      });
    } catch (error) {
      results.push({
        category: 'Syllabus Management',
        name: 'Get Syllabus Details',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 2: Assessments endpoints
    try {
      const response = await apiClient.get('/assessments/syllabus/1');
      results.push({
        category: 'Assessment Management',
        name: 'Get Syllabus Assessments',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} assessments found`
      });
    } catch (error) {
      results.push({
        category: 'Assessment Management',
        name: 'Get Syllabus Assessments',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 3: Specific assessment
    try {
      const response = await apiClient.get('/assessments/1');
      results.push({
        category: 'Assessment Management',
        name: 'Get Specific Assessment',
        status: '✅ PASSED',
        data: response.data,
        details: `Assessment: ${response.data.title}`
      });
    } catch (error) {
      results.push({
        category: 'Assessment Management',
        name: 'Get Specific Assessment',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 4: Sub-assessments
    try {
      const response = await apiClient.get('/sub-assessments/assessment/1');
      results.push({
        category: 'Sub-Assessment Management',
        name: 'Get Sub-Assessments',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} sub-assessments found`
      });
    } catch (error) {
      results.push({
        category: 'Sub-Assessment Management',
        name: 'Get Sub-Assessments',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 5: Students
    try {
      const response = await apiClient.get('/students/section/1');
      results.push({
        category: 'Student Management',
        name: 'Get Section Students',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} students found`
      });
    } catch (error) {
      results.push({
        category: 'Student Management',
        name: 'Get Section Students',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 6: ILOs
    try {
      const response = await apiClient.get('/ilos/syllabus/1');
      results.push({
        category: 'ILO Management',
        name: 'Get Syllabus ILOs',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} ILOs found`
      });
    } catch (error) {
      results.push({
        category: 'ILO Management',
        name: 'Get Syllabus ILOs',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 7: Rubrics
    try {
      const response = await apiClient.get('/rubrics/syllabus/1');
      results.push({
        category: 'Rubric Management',
        name: 'Get Syllabus Rubrics',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} rubrics found`
      });
    } catch (error) {
      results.push({
        category: 'Rubric Management',
        name: 'Get Syllabus Rubrics',
        status: '❌ FAILED',
        error: error.message
      });
    }

    // Test 8: Students with grades
    try {
      const response = await apiClient.get('/assessments/1/students-with-grades');
      results.push({
        category: 'Grading System',
        name: 'Get Students with Grades',
        status: '✅ PASSED',
        data: response.data,
        details: `${response.data.length} student grades found`
      });
    } catch (error) {
      results.push({
        category: 'Grading System',
        name: 'Get Students with Grades',
        status: '❌ FAILED',
        error: error.message
      });
    }

    setTestResults(results);
    
    // Calculate summary
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status.includes('PASSED')).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    setSummary({
      totalTests,
      passedTests,
      failedTests,
      successRate
    });
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await runAllTests();
    setRefreshing(false);
  };

  const groupTestsByCategory = () => {
    const grouped = {};
    testResults.forEach(test => {
      if (!grouped[test.category]) {
        grouped[test.category] = [];
      }
      grouped[test.category].push(test);
    });
    return grouped;
  };

  const renderTestResult = (test) => (
    <View key={test.name} style={styles.testCard}>
      <View style={styles.testHeader}>
        <Text style={styles.testName}>{test.name}</Text>
        <Text style={[
          styles.testStatus,
          { color: test.status.includes('PASSED') ? '#10B981' : '#EF4444' }
        ]}>
          {test.status}
        </Text>
      </View>
      
      {test.error ? (
        <Text style={styles.errorText}>Error: {test.error}</Text>
      ) : (
        <Text style={styles.detailText}>{test.details}</Text>
      )}
    </View>
  );

  const renderCategorySection = (category, tests) => (
    <View key={category} style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {tests.map(renderTestResult)}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={32} color="#6B7280" />
          <Text style={styles.loadingText}>Running comprehensive integration tests...</Text>
        </View>
      </View>
    );
  }

  const groupedTests = groupTestsByCategory();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frontend Integration Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive test results for all faculty modules
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Integration Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{summary.totalTests}</Text>
            <Text style={styles.summaryLabel}>Total Tests</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{summary.passedTests}</Text>
            <Text style={styles.summaryLabel}>Passed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>{summary.failedTests}</Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: summary.successRate >= 80 ? '#10B981' : '#F59E0B' }]}>
              {summary.successRate}%
            </Text>
            <Text style={styles.summaryLabel}>Success Rate</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.resultsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(groupedTests).map(([category, tests]) => 
          renderCategorySection(category, tests)
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            runAllTests();
          }}
        >
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Run All Tests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navigateButton}
          onPress={() => router.push('/users/faculty/dashboard')}
        >
          <Ionicons name="home-outline" size={16} color="#DC2626" />
          <Text style={styles.navigateButtonText}>Go to Dashboard</Text>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    paddingTop: 8,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    flex: 1,
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
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
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
    flex: 1,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  navigateButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    flex: 1,
  },
  navigateButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
}); 