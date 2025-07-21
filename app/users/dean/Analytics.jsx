import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeanAnalyticsHeader from '../../components/DeanAnalyticsHeader';

// Mock cluster data
const clusters = [
  {
    label: 'Consistent',
    color: '#10B981',
    icon: 'checkmark-done-circle',
    students: [
      'Alice Smith', 'David Lee', 'Fiona White', 'Isabel Cruz', 'James Tan', 'Maria Lopez', 'Nathan Kim', 'Olivia Chen', 'Paul Santos', 'Quinn Rivera'
    ],
    description: 'Students with steady performance.'
  },
  {
    label: 'Improving',
    color: '#F59E0B',
    icon: 'trending-up',
    students: [
      'Bob Johnson', 'Eva Green', 'Rafael Torres', 'Samantha Lim', 'Tina Park', 'Uma Patel', 'Victor Reyes', 'Wendy Ong'
    ],
    description: 'Students showing improvement.'
  },
  {
    label: 'At-Risk',
    color: '#EF4444',
    icon: 'alert-circle',
    students: [
      'Charlie Brown', 'Hannah Blue', 'Xander Cruz', 'Yara Gomez', 'Zane Lee', 'Brian Yu', 'Cathy Wu', 'Derek Chua', 'Ella Tan'
    ],
    description: 'Students needing intervention.'
  }
];

const recommendations = [
  {
    student: 'Charlie Brown',
    insight: 'Low quiz scores and irregular attendance.',
    suggestion: 'Schedule a meeting and provide extra resources.'
  },
  {
    student: 'Hannah Blue',
    insight: 'Declining assignment submissions.',
    suggestion: 'Assign a peer mentor and monitor progress.'
  }
];

export default function Analytics() {
  // --- Diagram Data (static for design) ---
  const clusterCounts = clusters.map(c => c.students.length);
  const total = clusterCounts.reduce((a, b) => a + b, 0);
  const clusterPercents = clusterCounts.map(count => Math.round((count / total) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <DeanAnalyticsHeader />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Learning Behavior Analytics</Text>
        <Text style={styles.description}>Clustering Algorithm for Learning Behavior</Text>

        {/* --- Diagrams Section --- */}
        <View style={styles.diagramsSection}>
          {/* Bar Chart Mockup */}
          <View style={styles.diagramCard}>
            <Text style={styles.diagramTitle}>Cluster Distribution (Bar Chart)</Text>
            <View style={styles.barChartContainer}>
              {clusters.map((cluster, idx) => (
                <View key={idx} style={styles.barItem}>
                  <View style={[styles.bar, { height: 18 + clusterCounts[idx] * 10, backgroundColor: cluster.color + '33' }]} />
                  <Text style={styles.barLabel}>{cluster.label}</Text>
                  <Text style={styles.barValue}>{clusterCounts[idx]}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Cluster Scatter Plot Mockup */}
          <View style={styles.diagramCard}>
            <Text style={styles.diagramTitle}>Cluster Scatter Plot</Text>
            <View style={styles.scatterPlotArea}>
              {clusters.map((cluster, cIdx) => (
                <View key={cIdx} style={styles.scatterClusterArea}>
                  <Text style={[styles.scatterClusterLabel, { color: cluster.color }]}>{cluster.label}</Text>
                  <View style={styles.scatterDotsRow}>
                    {cluster.students.map((student, sIdx) => (
                      <View key={sIdx} style={styles.scatterDotWrapper}>
                        <View style={[styles.scatterDot, { backgroundColor: cluster.color }]} />
                        <Text style={styles.scatterDotName}>{student}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* --- Existing Clusters and Recommendations --- */}
        <View style={styles.clustersSection}>
          {clusters.map((cluster, idx) => (
            <View key={idx} style={[styles.clusterCard, { borderColor: cluster.color }]}> 
              <View style={styles.clusterHeader}>
                <Ionicons name={cluster.icon} size={28} color={cluster.color} style={{ marginRight: 8 }} />
                <Text style={[styles.clusterLabel, { color: cluster.color }]}>{cluster.label}</Text>
              </View>
              <Text style={styles.clusterDesc}>{cluster.description}</Text>
              <Text style={styles.clusterStudentsTitle}>Students:</Text>
              {cluster.students.map((student, i) => (
                <Text key={i} style={styles.studentName}>• {student}</Text>
              ))}
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Reports & Recommendations</Text>
        <View style={styles.recommendationsSection}>
          {recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recommendationCard}>
              <Text style={styles.recStudent}><Ionicons name="person-circle-outline" size={18} color="#EF4444" /> {rec.student}</Text>
              <Text style={styles.recInsight}><Text style={{ fontWeight: 'bold' }}>Insight:</Text> {rec.insight}</Text>
              <Text style={styles.recSuggestion}><Text style={{ fontWeight: 'bold' }}>Suggestion:</Text> {rec.suggestion}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.downloadButtonText}>Download Report (Mock)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
  },
  clustersSection: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  clusterCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clusterLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  clusterDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  clusterStudentsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    marginTop: 6,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
    marginTop: 10,
  },
  recommendationsSection: {
    gap: 12,
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  recStudent: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  recInsight: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  recSuggestion: {
    fontSize: 14,
    color: '#10B981',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  diagramsSection: {
    marginBottom: 28,
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 220,
    flex: 1,
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 10,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    flex: 1,
    minHeight: 180,
    marginBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  barItem: {
    alignItems: 'center',
    width: 54,
    marginHorizontal: 4,
  },
  bar: {
    width: 22,
    borderRadius: 6,
    marginBottom: 6,
    minHeight: 18,
    backgroundColor: 'rgba(16,185,129,0.18)', // fallback, will be overridden inline
  },
  barLabel: {
    fontSize: 13,
    color: '#353A40',
    marginBottom: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  barValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    textAlign: 'center',
    marginTop: 1,
  },
  scatterPlotArea: {
    flexDirection: 'column',
    gap: 18,
    marginTop: 8,
    marginBottom: 8,
  },
  scatterClusterArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  scatterClusterLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  scatterDotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    alignItems: 'center',
  },
  scatterDotWrapper: {
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 8,
    width: 60,
  },
  scatterDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  scatterDotName: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
}); 