import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgramChairGenerateReportHeader from '../../components/ProgramChairGenerateReportHeader';

export default function GenerateReport() {
  const [reportGenerated, setReportGenerated] = useState(false);

  return (
    <View style={styles.container}>
      <ProgramChairGenerateReportHeader />
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>Generate Report</Text>
        <Text style={styles.description}>Auto-generate department reports</Text>
        
        <TouchableOpacity style={styles.button} onPress={() => setReportGenerated(true)}>
          <Ionicons name="cloud-download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Generate Report</Text>
        </TouchableOpacity>
        
        <View style={styles.reportSection}>
          {reportGenerated ? (
            <Text style={styles.reportText}>[Mock] Department report generated successfully!</Text>
          ) : (
            <Text style={styles.reportText}>No report generated yet.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  subtitle: { 
    fontSize: 18,
    fontWeight: 'bold', 
    color: '#353A40', 
    marginBottom: 8,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#DC2626', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 8, 
    marginBottom: 32 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  reportSection: { 
    width: '100%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    alignItems: 'center' 
  },
  reportText: { 
    fontSize: 16, 
    color: '#353A40' 
  },
}); 