import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ProgramChairAnalyticsHeader from '../../components/ProgramChairAnalyticsHeader';

export default function DepartmentAnalytics() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ProgramChairAnalyticsHeader />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Department Analytics</Text>
        <Text style={styles.description}>Insights and clustering for your department</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>92%</Text>
            <Text style={styles.statLabel}>Syllabus Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Faculty</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          {/* Bar Chart Placeholder */}
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartLabel}>Bar Chart: Syllabus Completion by Program</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faculty Clustering</Text>
          {/* Scatter Plot Placeholder */}
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartLabel}>Scatter Plot: Faculty Clusters</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  contentContainer: { 
    paddingBottom: 100 // Add space at bottom for navigation bar
  },
  content: { 
    paddingHorizontal: 16,
    paddingTop: 16
  },
  subtitle: { 
    fontSize: 18,
    fontWeight: 'bold', 
    color: '#353A40', 
    marginBottom: 8 
  },
  description: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginBottom: 24 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 24 
  },
  statCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    minWidth: 90, 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  statNumber: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#DC2626' 
  },
  statLabel: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  section: { 
    marginBottom: 32 
  },
  sectionTitle: { 
    fontSize: 18,
    fontWeight: '600', 
    color: '#353A40', 
    marginBottom: 16 
  },
  chartPlaceholder: { 
    height: 180, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  chartLabel: { 
    color: '#6B7280', 
    fontSize: 16 
  },
}); 