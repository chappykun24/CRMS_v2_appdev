import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StaffAcademicRecordsHeader from '../../components/StaffAcademicRecordsHeader';

const mockRecords = [
  {
    id: 1,
    subject: 'Introduction to Computer Science',
    code: 'CS101',
    faculty: 'Dr. John Doe',
    numStudents: 35,
    year: '2023-2024',
  },
  {
    id: 2,
    subject: 'Calculus I',
    code: 'MATH201',
    faculty: 'Dr. Jane Smith',
    numStudents: 28,
    year: '2023-2024',
  },
  {
    id: 3,
    subject: 'English Composition',
    code: 'ENG101',
    faculty: 'Dr. Michael Johnson',
    numStudents: 32,
    year: '2023-2024',
  },
];

export default function AcademicRecords() {
  const [search, setSearch] = useState('');
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const filteredRecords = mockRecords.filter(rec =>
    rec.subject.toLowerCase().includes(search.toLowerCase()) ||
    rec.code.toLowerCase().includes(search.toLowerCase()) ||
    rec.faculty.toLowerCase().includes(search.toLowerCase()) ||
    rec.year.includes(search)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StaffAcademicRecordsHeader
        search={search}
        setSearch={setSearch}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      
      <View style={styles.content}>
        {isTableView ? (
          <View style={styles.tableViewContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Subject</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Faculty</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}># Students</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Year</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>View</Text>
            </View>
            {filteredRecords.map(rec => (
              <View key={rec.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{rec.subject} <Text style={{ color: '#6B7280' }}>({rec.code})</Text></Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{rec.faculty}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{rec.numStudents}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{rec.year}</Text>
                <View style={[styles.tableCell, { flex: 1 }]}> 
                  <TouchableOpacity style={styles.viewButtonSmall}>
                    <Ionicons name="eye-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          filteredRecords.map(rec => (
            <View key={rec.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Ionicons name="book-outline" size={28} color="#DC2626" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.subject}>{rec.subject} <Text style={styles.code}>({rec.code})</Text></Text>
                  <Text style={styles.year}>Year: <Text style={styles.yearValue}>{rec.year}</Text></Text>
                </View>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.label}>Faculty Assigned:</Text>
                <Text style={styles.value}>{rec.faculty}</Text>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.label}>Number of Students:</Text>
                <Text style={styles.value}>{rec.numStudents}</Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Ionicons name="eye-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
  },
  tableViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 15,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    fontSize: 15,
    color: '#353A40',
    paddingHorizontal: 6,
  },
  viewButtonSmall: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subject: {
    fontSize: 17,
    fontWeight: '600',
    color: '#353A40',
  },
  code: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  year: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  yearValue: {
    fontWeight: '600',
    color: '#DC2626',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#6B7280',
    width: 130,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#353A40',
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignSelf: 'flex-end',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  viewButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
}); 