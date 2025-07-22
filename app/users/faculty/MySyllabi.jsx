import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import FacultyMySyllabusHeader from '../../components/FacultyMySyllabusHeader';
import { apiClient } from '../../utils/api';

export default function MySyllabiScreen() {
  const { currentUser } = useUser();
  const [syllabi, setSyllabi] = useState([]);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    apiClient
      .get(`/syllabus/my?facultyId=${currentUser.user_id}`)
      .then(response => {
        const data = response.data;
        const mapped = (Array.isArray(data) ? data : []).map(syl => ({
          id: syl.syllabus_id,
          syllabusId: syl.syllabus_id,
          title: syl.title || 'Untitled Syllabus',
          courseCode: syl.course_code || syl.course_id || 'N/A',
          courseTitle: syl.course_title || 'N/A',
          status: syl.approval_status || 'pending',
          reviewStatus: syl.review_status || 'pending',
          approvalStatus: syl.approval_status || 'pending',
          dateCreated: syl.created_at || '',
          dateReviewed: syl.reviewed_at || '',
          dateApproved: syl.approved_at || '',
          reviewedBy: syl.reviewer_name || syl.reviewed_by || '',
          approvedBy: syl.approver_name || syl.approved_by || '',
          term: syl.school_year && syl.semester ? `${syl.school_year} ${syl.semester}` : '',
          selectedILOs: syl.ilos || [], // Use ilos from backend
          assessments: syl.assessments || [] // Use real data from backend
        }));
        console.log('[MySyllabi] syllabi data:', mapped);
        setSyllabi(mapped);
      })
      .catch(err => {
        console.error('Failed to fetch syllabi:', err);
        setSyllabi([]);
      });
  }, [currentUser]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample syllabi data - using the same structure as classes for approved syllabi
  // const syllabi = [
  //   {
  //     id: 'syl-001',
  //     syllabusId: 1,
  //     title: 'IT101 Syllabus - Introduction to Information Technology',
  //     courseCode: 'IT101',
  //     courseTitle: 'Introduction to Information Technology',
  //     status: 'approved',
  //     reviewStatus: 'approved',
  //     approvalStatus: 'approved',
  //     dateCreated: '2024-01-15',
  //     dateReviewed: '2024-01-18',
  //     dateApproved: '2024-01-20',
  //     reviewedBy: 'Dr. Michael Chen',
  //     approvedBy: 'Dr. Sarah Johnson',
  //     courseDescription: 'Fundamental concepts of information technology and programming',
  //     units: '3',
  //     term: '2024-2025 1st Semester',
  //     specialization: 'Information Technology',
  //     prerequisites: 'None',
  //     courseObjectives: 'Understand basic IT concepts and programming fundamentals',
  //     learningOutcomes: 'Students will be able to write simple programs and understand computational thinking',
  //     courseContent: 'Variables, loops, functions, basic algorithms, IT fundamentals',
  //     teachingMethods: 'Lectures, hands-on programming exercises, group projects',
  //     assessmentMethods: 'Quizzes (30%), Midterm (30%), Final Project (40%)',
  //     gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
  //     references: 'Starting Out with Python by Tony Gaddis',
  //     schedule: 'MWF 9:00-10:30 AM',
  //     officeHours: 'Tuesdays 2:00-4:00 PM',
  //     contactInfo: 'Office: Room 301, Email: faculty@university.edu',
  //     selectedILOs: [
  //       { id: 1, code: 'ILO1', description: 'Demonstrate understanding of fundamental programming concepts' },
  //       { id: 2, code: 'ILO2', description: 'Apply problem-solving techniques to computational problems' },
  //       { id: 3, code: 'ILO3', description: 'Write and debug simple computer programs' }
  //     ]
  //   },
  //   {
  //     id: 'syl-002',
  //     syllabusId: 2,
  //     title: 'IT201 Syllabus - Database Management Systems',
  //     courseCode: 'IT201',
  //     courseTitle: 'Database Management Systems',
  //     status: 'approved',
  //     reviewStatus: 'approved',
  //     approvalStatus: 'approved',
  //     dateCreated: '2024-01-18',
  //     dateReviewed: '2024-01-20',
  //     dateApproved: '2024-01-22',
  //     reviewedBy: 'Dr. Emily Davis',
  //     approvedBy: 'Dr. Sarah Johnson',
  //     courseDescription: 'Introduction to database design and management',
  //     units: '4',
  //     term: '2024-2025 1st Semester',
  //     specialization: 'Information Technology',
  //     prerequisites: 'IT101 or equivalent',
  //     courseObjectives: 'Master fundamental concepts of database design and SQL',
  //     learningOutcomes: 'Students will be able to design databases and write SQL queries',
  //     courseContent: 'Database design, SQL, normalization, ER diagrams',
  //     teachingMethods: 'Lectures, hands-on database exercises, projects',
  //     assessmentMethods: 'Database Design (30%), SQL Quizzes (30%), Final Project (40%)',
  //     gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
  //     references: 'Database Systems: The Complete Book by Hector Garcia-Molina',
  //     schedule: 'TTh 10:00-11:30 AM',
  //     officeHours: 'Wednesdays 1:00-3:00 PM',
  //     contactInfo: 'Office: Room 205, Email: faculty@university.edu',
  //     selectedILOs: [
  //       { id: 4, code: 'ILO4', description: 'Analyze and evaluate database concepts' },
  //       { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' }
  //     ]
  //   },
  //   {
  //     id: 'syl-003',
  //     syllabusId: 3,
  //     title: 'CS101 Syllabus - Introduction to Computer Science',
  //     courseCode: 'CS101',
  //     courseTitle: 'Introduction to Computer Science',
  //     status: 'pending',
  //     reviewStatus: 'pending',
  //     approvalStatus: 'pending',
  //     dateCreated: '2024-01-22',
  //     dateReviewed: null,
  //     dateApproved: null,
  //     reviewedBy: null,
  //     approvedBy: null,
  //     courseDescription: 'Basic computer science concepts and programming',
  //     units: '3',
  //     term: '2024-2025 1st Semester',
  //     specialization: 'Computer Science',
  //     prerequisites: 'None',
  //     courseObjectives: 'Develop programming and problem-solving skills',
  //     learningOutcomes: 'Students will be able to write clear, efficient programs',
  //     courseContent: 'Programming fundamentals, algorithms, data structures',
  //     teachingMethods: 'Workshop-style classes, coding exercises, projects',
  //     assessmentMethods: 'Programming Assignments (60%), Quizzes (20%), Final Exam (20%)',
  //     gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
  //     references: 'Introduction to Computer Science by John Smith',
  //     schedule: 'MWF 11:00-12:30 PM',
  //     officeHours: 'Fridays 2:00-4:00 PM',
  //     contactInfo: 'Office: Room 110, Email: faculty@university.edu',
  //     selectedILOs: [
  //       { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' },
  //       { id: 6, code: 'ILO6', description: 'Work collaboratively in team environments' }
  //     ]
  //   }
  // ];

  const getStatusColor = (status) => {
    const colors = {
      'approved': '#10B981',
      'pending': '#F59E0B',
      'draft': '#6B7280',
      'rejected': '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'approved': 'checkmark-circle',
      'pending': 'time',
      'draft': 'document-outline',
      'rejected': 'close-circle'
    };
    return icons[status] || 'document-outline';
  };

  const getStatusText = (status) => {
    const texts = {
      'approved': 'Approved',
      'pending': 'Pending Review',
      'draft': 'Draft',
      'rejected': 'Rejected'
    };
    return texts[status] || 'Unknown';
  };

  const handleViewSyllabus = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setShowSyllabusModal(true);
  };

  const handleEditSyllabus = (syllabus) => {
    setShowSyllabusModal(false);
    setTimeout(() => {
      router.push({ pathname: '/users/faculty/SyllabiCreation', params: { syllabusId: syllabus.syllabusId || syllabus.id } });
    }, 300);
  };

  const handleDeleteSyllabus = (syllabus) => {
    Alert.alert(
      'Delete Syllabus',
      `Are you sure you want to delete the syllabus for ${syllabus.courseCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Deleted', 'Syllabus deleted successfully!')
        }
      ]
    );
  };

  const handleCreateNew = () => {
    router.push('/users/faculty/SyllabiCreation');
  };

  const handleBack = () => {
    router.back();
  };

  const filteredSyllabi = syllabi.filter(syllabus => {
    if (selectedFilter === 'all') return true;
    return syllabus.status === selectedFilter;
  }).filter(syllabus => {
    if (!searchQuery) return true;
    return syllabus.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
           syllabus.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  console.log('[MySyllabi] filteredSyllabi:', filteredSyllabi);

  const renderSyllabusCard = (syllabus) => {
    return (
      <TouchableOpacity key={syllabus.id} style={styles.syllabusCard} onPress={() => handleViewSyllabus(syllabus)} activeOpacity={0.85}>
        <View style={styles.syllabusHeader}>
          <View style={styles.syllabusInfo}>
            <Text style={styles.syllabusTitle}>{String(syllabus.courseCode ?? '')} - {String(syllabus.courseTitle ?? '')}</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{String(syllabus.term ?? '')}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(syllabus.status)}20` }]}> 
            <Ionicons name={getStatusIcon(syllabus.status)} size={16} color={getStatusColor(syllabus.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(syllabus.status) }]}> 
              {getStatusText(syllabus.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const windowHeight = Dimensions.get('window').height;

  // Helper to safely render any value as a string
  const safeText = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      // Handle Firestore Timestamp-like objects
      if (val instanceof Date) return val.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      if (val.seconds && typeof val.seconds === 'number') {
        try {
          return new Date(val.seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
          return 'N/A';
        }
      }
      return 'N/A';
    }
    // Format date strings like '2025-05-30 00:00:00'
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const date = new Date(val.replace(' ', 'T'));
      if (!isNaN(date)) {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
    return String(val);
  };

  // Helper to format date strings
  const formatDate = (val) => {
    if (!val) return 'N/A';
    const date = new Date(val);
    if (isNaN(date)) return String(val);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderSyllabusModal = () => {
    const fields = selectedSyllabus ? [
      { label: 'Course Code', value: selectedSyllabus.courseCode },
      { label: 'Course Title', value: selectedSyllabus.courseTitle },
      { label: 'Term', value: selectedSyllabus.term },
      { label: 'Syllabus Title', value: selectedSyllabus.title },
      { label: 'Status', value: getStatusText(selectedSyllabus.status) },
      { label: 'Reviewed By', value: selectedSyllabus.reviewedBy },
      { label: 'Approved By', value: selectedSyllabus.approvedBy },
      { label: 'Date Created', value: safeText(selectedSyllabus.dateCreated) },
      { label: 'Date Reviewed', value: safeText(selectedSyllabus.dateReviewed) },
      { label: 'Date Approved', value: (!selectedSyllabus.dateApproved || selectedSyllabus.dateApproved === 'null') ? 'Pending' : (safeText(selectedSyllabus.dateApproved) || 'Pending') },
    ] : [];
    return (
      <Modal
        visible={showSyllabusModal && !!selectedSyllabus}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSyllabusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 300, maxWidth: 380, width: '90%', maxHeight: '85%', alignItems: 'stretch', elevation: 4 }}>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 18, alignSelf: 'center', color: '#DC2626' }}>Syllabus Details</Text>
              {selectedSyllabus && (
                <>
                  {/* Syllabus Info */}
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#1E293B', marginBottom: 12, letterSpacing: 0.5 }}>Syllabus Information</Text>
                    {fields.map((field, idx) => (
                      <View key={field.label} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                        <Text style={{ fontWeight: '600', minWidth: 130, color: '#334155', fontSize: 14 }}>{field.label}:</Text>
                        <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontWeight: '400' }}>{safeText(field.value)}</Text>
                      </View>
                    ))}
                  </View>
                  {/* ILOs */}
                  {Array.isArray(selectedSyllabus.selectedILOs) && selectedSyllabus.selectedILOs.length > 0 && (
                    <View style={{ marginBottom: 24, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 14 }}>
                      <Text style={{ fontWeight: 'bold', color: '#DC2626', marginBottom: 8, fontSize: 15, letterSpacing: 0.5 }}>Intended Learning Outcomes (ILOs)</Text>
                      {selectedSyllabus.selectedILOs.map(ilo => (
                        <View key={safeText(ilo.id)} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>{ilo.code}</Text>
                          <Text style={{ fontSize: 13, color: '#475569', marginLeft: 10 }}>{ilo.description}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {/* Assessments */}
                  {Array.isArray(selectedSyllabus.assessments) && selectedSyllabus.assessments.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ fontWeight: 'bold', color: '#DC2626', marginBottom: 10, fontSize: 15, letterSpacing: 0.5 }}>Assessments</Text>
                      {selectedSyllabus.assessments.map(assess => (
                        <View key={assess.id} style={{ backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: 'bold', letterSpacing: 0.2 }}>{assess.title}</Text>
                          </View>
                          {/* Weights */}
                          {Array.isArray(assess.weights) && assess.weights.length > 0 && (
                            <View style={{ marginLeft: 6, marginTop: 2, marginBottom: 6 }}>
                              <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: 'bold', marginBottom: 2 }}>Weights:</Text>
                              {assess.weights.map((w, idx) => (
                                <Text key={idx} style={{ fontSize: 12, color: '#6366F1', fontWeight: '500' }}>
                                  {w.ilo_code}: {w.ilo_description} — {w.weight_percentage}%
                                </Text>
                              ))}
                            </View>
                          )}
                          {/* Rubrics */}
                          {Array.isArray(assess.rubrics) && assess.rubrics.length > 0 && (
                            <View style={{ marginLeft: 6, marginTop: 2 }}>
                              <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: 'bold', marginBottom: 2 }}>Rubrics:</Text>
                              {assess.rubrics.map((r, ridx) => (
                                <View key={r.rubric_id || ridx} style={{ marginBottom: 4, backgroundColor: '#FFF', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                  <Text style={{ fontSize: 12, color: '#1E293B', fontWeight: 'bold', marginBottom: 1 }}>{r.title}</Text>
                                  <Text style={{ fontSize: 12, color: '#475569', marginBottom: 1 }}>{r.description}</Text>
                                  <Text style={{ fontSize: 12, color: '#6366F1', marginBottom: 1 }}>Criterion: <Text style={{ fontWeight: '600' }}>{r.criterion}</Text></Text>
                                  <Text style={{ fontSize: 12, color: '#6366F1' }}>Max Score: <Text style={{ fontWeight: '600' }}>{r.max_score}</Text></Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  {/* Actions */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.actionButton, { marginHorizontal: 4 }]} onPress={() => handleEditSyllabus(selectedSyllabus)}>
                      <Ionicons name="create-outline" size={16} color="#DC2626" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton, { marginHorizontal: 4 }]} onPress={() => handleDeleteSyllabus(selectedSyllabus)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              <TouchableOpacity onPress={() => setShowSyllabusModal(false)} style={{ marginTop: 18, padding: 10, backgroundColor: '#6366F1', borderRadius: 8, alignSelf: 'center', minWidth: 100 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FacultyMySyllabusHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onAddSyllabus={handleCreateNew}
      />

      <View style={styles.content}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                {`All (${syllabi.length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'draft' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('draft')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'draft' && styles.filterChipTextActive]}>
                {`Draft (${syllabi.filter(s => s.status === 'draft').length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'pending' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('pending')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'pending' && styles.filterChipTextActive]}>
                {`Pending (${syllabi.filter(s => s.status === 'pending').length})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'approved' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('approved')}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'approved' && styles.filterChipTextActive]}>
                {`Approved (${syllabi.filter(s => s.status === 'approved').length})`}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Syllabi List */}
        <ScrollView style={styles.syllabiContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.syllabiContentContainer}>
          {filteredSyllabi.length > 0 ? (
            filteredSyllabi.map(renderSyllabusCard)
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No syllabi found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first syllabus to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleCreateNew}>
                  <Text style={styles.emptyButtonText}>Create Syllabus</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {renderSyllabusModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#DC2626',
  },
  syllabiContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  syllabiContentContainer: {
    paddingBottom: 100, // Add padding at the bottom for bottom navigation
  },
  syllabusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  syllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  syllabusInfo: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  syllabusSchedule: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  syllabusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  syllabusStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  syllabusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  syllabusDetails: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#353A40',
    marginBottom: 12,
    lineHeight: 22,
  },
  iloItem: {
    marginBottom: 8,
  },
  iloCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  iloDescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
}); 