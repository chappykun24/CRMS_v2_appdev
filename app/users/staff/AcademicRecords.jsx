import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../../utils/api.js';
import StaffAcademicRecordsHeader from '../../components/StaffAcademicRecordsHeader';

// Removed mockRecords dummy data

export default function AcademicRecords() {
  const [search, setSearch] = useState('');
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [approvedClasses, setApprovedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  // Removed: const navigation = useNavigation();

  useEffect(() => {
    setLoading(true);
    apiClient.get('/syllabus/approved')
      .then(data => {
        setApprovedClasses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setApprovedClasses([]);
        setLoading(false);
      });
  }, []);

  // Filter by search
  const filteredClasses = approvedClasses.filter(cls => {
    const q = search.toLowerCase();
    return (
      (cls.course_title || '').toLowerCase().includes(q) ||
      (cls.course_code || '').toLowerCase().includes(q) ||
      (cls.faculty_name || '').toLowerCase().includes(q) ||
      (cls.semester || '').toLowerCase().includes(q) ||
      (cls.school_year || '').toLowerCase().includes(q)
    );
  });

  console.log('filteredClasses:', filteredClasses);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StaffAcademicRecordsHeader
        title="Classes"
        search={search}
        setSearch={setSearch}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      <View style={styles.content}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 32 }}>Loading approved classes...</Text>
        ) : filteredClasses.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 32 }}>No approved classes found.</Text>
        ) : isTableView ? (
          <View style={styles.tableViewContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Class</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Faculty</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Term</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Year</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>View</Text>
            </View>
            {filteredClasses.map(cls => (
              <View key={cls.syllabus_id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{cls.course_title} <Text style={{ color: '#6B7280' }}>({cls.course_code})</Text></Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{cls.faculty_name}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{cls.semester}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{cls.school_year}</Text>
                <View style={[styles.tableCell, { flex: 1 }]}> 
                  <TouchableOpacity style={styles.viewButtonSmall}>
                    <Ionicons name="eye-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          filteredClasses.map(cls => (
            <TouchableOpacity
              key={cls.syllabus_id}
              style={styles.recordCard}
              onPress={() => router.push({ pathname: '/users/staff/ClassStudents', params: { section_course_id: cls.section_course_id, syllabus_id: cls.syllabus_id } })}
            >
              <View style={styles.recordHeader}>
                {/* <Ionicons name="book-outline" size={28} color="#DC2626" style={{ marginRight: 10 }} /> */}
                <View>
                  <Text style={styles.subject}>{cls.course_title} <Text style={styles.code}>({cls.course_code})</Text></Text>
                  {cls.section_code && (
                    <Text style={styles.section}>Section: <Text style={styles.sectionValue}>{cls.section_code}</Text></Text>
                  )}
                  <Text style={styles.year}>Year: <Text style={styles.yearValue}>{cls.school_year}</Text></Text>
                  <Text style={styles.year}>Term: <Text style={styles.yearValue}>{cls.semester}</Text></Text>
                </View>
              </View>
              <View style={styles.recordRow}>
                <Text style={styles.label}>Faculty Assigned:</Text>
                <Text style={styles.value}>{cls.faculty_name}</Text>
              </View>
              <TouchableOpacity style={styles.viewButton} onPress={() => router.push({ pathname: '/users/staff/ClassStudents', params: { section_course_id: cls.section_course_id, syllabus_id: cls.syllabus_id } })}>
                <Ionicons name="eye-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
  section: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionValue: {
    fontWeight: '600',
    color: '#DC2626',
  },
}); 