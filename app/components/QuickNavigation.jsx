import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function QuickNavigation() {
  const handleNavigate = (path, params = null) => {
    if (params) {
      router.push({
        pathname: path,
        params: params
      });
    } else {
      router.push(path);
    }
  };

  const showClassOptions = () => {
    Alert.alert(
      'Select Class Parameters',
      'Choose the section_course_id and syllabus_id for testing:',
      [
        {
          text: 'Class 1 (ID: 1, Syllabus: 1)',
          onPress: () => handleNavigate('/users/faculty/AssessmentManagement', { section_course_id: 1, syllabus_id: 1 })
        },
        {
          text: 'Class 2 (ID: 2, Syllabus: 2)',
          onPress: () => handleNavigate('/users/faculty/AssessmentManagement', { section_course_id: 2, syllabus_id: 2 })
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const showGradeOptions = () => {
    Alert.alert(
      'Select Class Parameters',
      'Choose the section_course_id and syllabus_id for testing:',
      [
        {
          text: 'Class 1 (ID: 1, Syllabus: 1)',
          onPress: () => handleNavigate('/users/faculty/GradeManagement', { section_course_id: 1, syllabus_id: 1 })
        },
        {
          text: 'Class 2 (ID: 2, Syllabus: 2)',
          onPress: () => handleNavigate('/users/faculty/GradeManagement', { section_course_id: 2, syllabus_id: 2 })
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Navigation</Text>
      <Text style={styles.subtitle}>Test the new functionality</Text>
      
      <View style={styles.navigationGrid}>
        {/* Test Pages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Testing</Text>
          
          <TouchableOpacity 
            style={styles.navCard}
            onPress={() => handleNavigate('/users/faculty/TestConnection')}
          >
            <Ionicons name="wifi-outline" size={24} color="#DC2626" />
            <Text style={styles.navCardTitle}>Connection Test</Text>
            <Text style={styles.navCardSubtitle}>Test API connectivity</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navCard}
            onPress={() => handleNavigate('/users/faculty/TestAssessmentIntegration')}
          >
            <Ionicons name="bug-outline" size={24} color="#DC2626" />
            <Text style={styles.navCardTitle}>API Test</Text>
            <Text style={styles.navCardSubtitle}>Test individual endpoints</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navCard}
            onPress={() => handleNavigate('/users/faculty/DashboardIntegrationTest')}
          >
            <Ionicons name="analytics-outline" size={24} color="#DC2626" />
            <Text style={styles.navCardTitle}>Dashboard Test</Text>
            <Text style={styles.navCardSubtitle}>Comprehensive testing</Text>
          </TouchableOpacity>
        </View>

        {/* Main Pages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Main Pages</Text>
          
          <TouchableOpacity 
            style={styles.navCard}
            onPress={showClassOptions}
          >
            <Ionicons name="document-text-outline" size={24} color="#10B981" />
            <Text style={styles.navCardTitle}>Assessment Management</Text>
            <Text style={styles.navCardSubtitle}>Manage assessments & sub-tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navCard}
            onPress={showGradeOptions}
          >
            <Ionicons name="school-outline" size={24} color="#3B82F6" />
            <Text style={styles.navCardTitle}>Grade Management</Text>
            <Text style={styles.navCardSubtitle}>Grade students & track performance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 How to Use:</Text>
        <Text style={styles.infoText}>1. Start with the test pages to verify API connectivity</Text>
        <Text style={styles.infoText}>2. Then try the main pages with different class parameters</Text>
        <Text style={styles.infoText}>3. Check the console for any errors or success messages</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  navigationGrid: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  navCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  navCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
}); 