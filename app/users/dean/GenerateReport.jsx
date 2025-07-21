import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeanReportHeader from '../../components/DeanReportHeader';

export default function GenerateReport() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <DeanReportHeader />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Summary of Academic Performance</Text>
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Reporting Period:</Text>
          <Text style={styles.summaryValue}>2nd Semester, AY 2023-2024</Text>
          <Text style={styles.summaryLabel}>Total Students:</Text>
          <Text style={styles.summaryValue}>120</Text>
          <Text style={styles.summaryLabel}>At-Risk Students:</Text>
          <Text style={styles.summaryValue}>9</Text>
          <Text style={styles.summaryLabel}>Consistent Performers:</Text>
          <Text style={styles.summaryValue}>10</Text>
          <Text style={styles.summaryLabel}>Improving Students:</Text>
          <Text style={styles.summaryValue}>8</Text>
        </View>
        <View style={styles.reportPreview}>
          <Text style={styles.previewTitle}>Report Preview</Text>
          <Text style={styles.previewText}>
            This report provides an overview of student performance, highlights at-risk learners, and offers recommendations for intervention. For a detailed breakdown, download the full report below.
          </Text>
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
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 18,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  summaryValue: {
    fontSize: 15,
    color: '#353A40',
    fontWeight: '600',
    marginBottom: 2,
  },
  reportPreview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 6,
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
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
}); 