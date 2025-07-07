import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function MySyllabiScreen() {
  const { currentUser } = useUser();
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample syllabi data - in a real app, this would come from an API
  const syllabi = [
    {
      id: 'syl-001',
      syllabusId: 1,
      title: 'CS101 Syllabus - Introduction to Programming',
      courseCode: 'CS101',
      courseTitle: 'Introduction to Computer Science',
      status: 'approved',
      reviewStatus: 'approved',
      approvalStatus: 'approved',
      dateCreated: '2024-01-15',
      dateReviewed: '2024-01-18',
      dateApproved: '2024-01-20',
      reviewedBy: 'Dr. Michael Chen',
      approvedBy: 'Dr. Sarah Johnson',
      courseDescription: 'Fundamental concepts of computer science and programming',
      units: '3',
      term: '2024-2025 1st Semester',
      specialization: 'Computer Science',
      prerequisites: 'None',
      courseObjectives: 'Understand basic programming concepts and problem-solving techniques',
      learningOutcomes: 'Students will be able to write simple programs and understand computational thinking',
      courseContent: 'Variables, loops, functions, basic algorithms',
      teachingMethods: 'Lectures, hands-on programming exercises, group projects',
      assessmentMethods: 'Quizzes (30%), Midterm (30%), Final Project (40%)',
      gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
      references: 'Starting Out with Python by Tony Gaddis',
      schedule: 'MWF 9:00-10:30 AM',
      officeHours: 'Tuesdays 2:00-4:00 PM',
      contactInfo: 'Office: Room 301, Email: faculty@university.edu',
      selectedILOs: [
        { id: 1, code: 'ILO1', description: 'Demonstrate understanding of fundamental programming concepts' },
        { id: 2, code: 'ILO2', description: 'Apply problem-solving techniques to computational problems' },
        { id: 3, code: 'ILO3', description: 'Write and debug simple computer programs' }
      ]
    },
    {
      id: 'syl-002',
      syllabusId: 2,
      title: 'MATH201 Syllabus - Calculus I',
      courseCode: 'MATH201',
      courseTitle: 'Calculus I',
      status: 'pending',
      reviewStatus: 'pending',
      approvalStatus: 'pending',
      dateCreated: '2024-01-18',
      dateReviewed: null,
      dateApproved: null,
      reviewedBy: null,
      approvedBy: null,
      courseDescription: 'Introduction to differential calculus',
      units: '4',
      term: '2024-2025 1st Semester',
      specialization: 'Mathematics',
      prerequisites: 'MATH101 or equivalent',
      courseObjectives: 'Master fundamental concepts of calculus and their applications',
      learningOutcomes: 'Students will be able to compute derivatives and understand their applications',
      courseContent: 'Limits, continuity, derivatives, applications of derivatives',
      teachingMethods: 'Lectures, problem-solving sessions, homework assignments',
      assessmentMethods: 'Homework (20%), Quizzes (30%), Midterm (25%), Final (25%)',
      gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
      references: 'Calculus: Early Transcendentals by James Stewart',
      schedule: 'TTh 10:00-11:30 AM',
      officeHours: 'Wednesdays 1:00-3:00 PM',
      contactInfo: 'Office: Room 205, Email: faculty@university.edu',
      selectedILOs: [
        { id: 4, code: 'ILO4', description: 'Analyze and evaluate mathematical concepts' },
        { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' }
      ]
    },
    {
      id: 'syl-003',
      syllabusId: 3,
      title: 'ENG101 Syllabus - English Composition',
      courseCode: 'ENG101',
      courseTitle: 'English Composition',
      status: 'draft',
      reviewStatus: 'draft',
      approvalStatus: 'draft',
      dateCreated: '2024-01-22',
      dateReviewed: null,
      dateApproved: null,
      reviewedBy: null,
      approvedBy: null,
      courseDescription: 'Basic composition and rhetoric',
      units: '3',
      term: '2024-2025 1st Semester',
      specialization: 'English',
      prerequisites: 'None',
      courseObjectives: 'Develop effective writing and communication skills',
      learningOutcomes: 'Students will be able to write clear, coherent essays',
      courseContent: 'Essay writing, grammar, research methods',
      teachingMethods: 'Workshop-style classes, peer review, individual conferences',
      assessmentMethods: 'Essays (60%), Participation (20%), Final Portfolio (20%)',
      gradingSystem: 'A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60',
      references: 'The Norton Field Guide to Writing by Richard Bullock',
      schedule: 'MWF 11:00-12:30 PM',
      officeHours: 'Fridays 2:00-4:00 PM',
      contactInfo: 'Office: Room 110, Email: faculty@university.edu',
      selectedILOs: [
        { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' },
        { id: 6, code: 'ILO6', description: 'Work collaboratively in team environments' }
      ]
    }
  ];

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
    Alert.alert(
      'Edit Syllabus',
      `Edit syllabus for ${syllabus.courseCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => router.push('/syllabi-creation') }
      ]
    );
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
    router.push('/syllabi-creation');
  };

  const filteredSyllabi = syllabi.filter(syllabus => {
    if (selectedFilter === 'all') return true;
    return syllabus.status === selectedFilter;
  });

  const renderSyllabusModal = () => (
    <Modal
      visible={showSyllabusModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSyllabusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Syllabus Details</Text>
            <TouchableOpacity onPress={() => setShowSyllabusModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {selectedSyllabus && (
            <ScrollView style={styles.syllabusDetails}>
                          <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Syllabus Information</Text>
              <Text style={styles.detailLabel}>Syllabus Title:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.title}</Text>
              
              <Text style={styles.detailLabel}>Course Code:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.courseCode}</Text>
              
              <Text style={styles.detailLabel}>Course Title:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.courseTitle}</Text>
              
              <Text style={styles.detailLabel}>Units:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.units}</Text>
              
              <Text style={styles.detailLabel}>Specialization:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.specialization}</Text>
              
              <Text style={styles.detailLabel}>Term:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.term}</Text>
              
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{selectedSyllabus.courseDescription}</Text>
            </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Status Information</Text>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon(selectedSyllabus.status)} 
                    size={16} 
                    color={getStatusColor(selectedSyllabus.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedSyllabus.status) }]}>
                    {getStatusText(selectedSyllabus.status)}
                  </Text>
                </View>
                
                <Text style={styles.detailLabel}>Date Created:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.dateCreated}</Text>
                
                {selectedSyllabus.dateApproved && (
                  <>
                    <Text style={styles.detailLabel}>Date Approved:</Text>
                    <Text style={styles.detailValue}>{selectedSyllabus.dateApproved}</Text>
                    
                    <Text style={styles.detailLabel}>Approved By:</Text>
                    <Text style={styles.detailValue}>{selectedSyllabus.approvedBy}</Text>
                  </>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Course Details</Text>
                <Text style={styles.detailLabel}>Prerequisites:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.prerequisites}</Text>
                
                <Text style={styles.detailLabel}>Course Objectives:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.courseObjectives}</Text>
                
                <Text style={styles.detailLabel}>Learning Outcomes:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.learningOutcomes}</Text>
              </View>

              {selectedSyllabus.selectedILOs && selectedSyllabus.selectedILOs.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Intended Learning Outcomes</Text>
                  {selectedSyllabus.selectedILOs.map((ilo, index) => (
                    <View key={ilo.id} style={styles.iloItem}>
                      <Text style={styles.iloCode}>{ilo.code}</Text>
                      <Text style={styles.iloDescription}>{ilo.description}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Teaching & Assessment</Text>
                <Text style={styles.detailLabel}>Course Content:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.courseContent}</Text>
                
                <Text style={styles.detailLabel}>Teaching Methods:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.teachingMethods}</Text>
                
                <Text style={styles.detailLabel}>Assessment Methods:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.assessmentMethods}</Text>
                
                <Text style={styles.detailLabel}>Grading System:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.gradingSystem}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Additional Information</Text>
                <Text style={styles.detailLabel}>References:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.references}</Text>
                
                <Text style={styles.detailLabel}>Schedule:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.schedule}</Text>
                
                <Text style={styles.detailLabel}>Office Hours:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.officeHours}</Text>
                
                <Text style={styles.detailLabel}>Contact Information:</Text>
                <Text style={styles.detailValue}>{selectedSyllabus.contactInfo}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#353A40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Syllabi</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
            <Ionicons name="add" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'approved' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('approved')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'approved' && styles.filterButtonTextActive]}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'draft' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('draft')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'draft' && styles.filterButtonTextActive]}>Drafts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Syllabi List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSyllabi.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No syllabi found</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? "You haven't created any syllabi yet." 
                : `No ${selectedFilter} syllabi found.`
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity style={styles.createNewButton} onPress={handleCreateNew}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createNewButtonText}>Create Your First Syllabus</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredSyllabi.map((syllabus) => (
            <View key={syllabus.id} style={styles.syllabusCard}>
              <View style={styles.syllabusHeader}>
                <View style={styles.syllabusInfo}>
                  <Text style={styles.syllabusTitle}>{syllabus.title}</Text>
                  <Text style={styles.courseCode}>{syllabus.courseCode} - {syllabus.courseTitle}</Text>
                  <Text style={styles.courseUnits}>{syllabus.units} units • {syllabus.specialization}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Ionicons 
                    name={getStatusIcon(syllabus.status)} 
                    size={16} 
                    color={getStatusColor(syllabus.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(syllabus.status) }]}>
                    {getStatusText(syllabus.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.courseDescription} numberOfLines={2}>
                {syllabus.courseDescription}
              </Text>

              <View style={styles.syllabusMeta}>
                <Text style={styles.metaText}>Term: {syllabus.term}</Text>
                <Text style={styles.metaText}>Created: {syllabus.dateCreated}</Text>
                {syllabus.dateReviewed && (
                  <Text style={styles.metaText}>Reviewed: {syllabus.dateReviewed}</Text>
                )}
                {syllabus.dateApproved && (
                  <Text style={styles.metaText}>Approved: {syllabus.dateApproved}</Text>
                )}
              </View>

              <View style={styles.syllabusActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleViewSyllabus(syllabus)}
                >
                  <Ionicons name="eye-outline" size={16} color="#DC2626" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>

                {(syllabus.status === 'draft' || syllabus.status === 'rejected') && (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleEditSyllabus(syllabus)}
                  >
                    <Ionicons name="create-outline" size={16} color="#6B7280" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}

                {syllabus.status === 'draft' && (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleDeleteSyllabus(syllabus)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {renderSyllabusModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  createButton: {
    padding: 8,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createNewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  syllabusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 4,
  },
  courseUnits: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  syllabusMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  syllabusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
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
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  iloCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  iloDescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
}); 