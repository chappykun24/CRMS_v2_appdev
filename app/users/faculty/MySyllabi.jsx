import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api';
import FacultyMySyllabusHeader from '../../components/FacultyMySyllabusHeader';

export default function MySyllabiScreen() {
  const { currentUser } = useUser();
  const [syllabi, setSyllabi] = useState([]);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchSyllabi();
  }, [currentUser]);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/syllabus/my?facultyId=${currentUser.user_id}`);
      console.log('Fetched syllabi:', data);
      
      const mapped = (Array.isArray(data) ? data : []).map(syl => ({
        id: syl.syllabus_id,
        syllabusId: syl.syllabus_id,
        title: syl.title || 'Untitled Syllabus',
        description: syl.description || '',
        courseCode: syl.course_code || 'N/A',
        courseTitle: syl.course_title || 'N/A',
        sectionCode: syl.section_code || 'N/A',
        status: syl.approval_status || 'pending',
        reviewStatus: syl.review_status || 'pending',
        approvalStatus: syl.approval_status || 'pending',
        dateCreated: syl.created_at || '',
        dateReviewed: syl.reviewed_at || '',
        dateApproved: syl.approved_at || '',
        reviewedBy: syl.reviewer_name || '',
        approvedBy: syl.approver_name || '',
        selectedILOs: syl.ilos || [],
        assessments: syl.assessments || [],
        rubrics: syl.rubrics || [],
        term: (syl.school_year && syl.semester) ? `${syl.school_year} ${syl.semester}` : '',
        version: syl.version || '1.0',
        isTemplate: syl.is_template || false,
        templateName: syl.template_name || '',
        assessmentFramework: syl.assessment_framework || {},
        gradingPolicy: syl.grading_policy || {},
        courseOutline: syl.course_outline || '',
        learningResources: syl.learning_resources || [],
        prerequisites: syl.prerequisites || '',
        courseObjectives: syl.course_objectives || ''
      }));
      
      console.log('Mapped syllabi:', mapped);
      setSyllabi(mapped);
    } catch (err) {
      console.log('Error fetching syllabi:', err);
      setSyllabi([]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const getFilteredSyllabi = () => {
    let filtered = syllabi;
    
    if (selectedFilter !== 'all') {
      filtered = syllabi.filter(syl => syl.status === selectedFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(syl => 
        syl.title.toLowerCase().includes(query) ||
        syl.courseCode.toLowerCase().includes(query) ||
        syl.courseTitle.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Amber
      case 'approved':
        return '#10B981'; // Green
      case 'rejected':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline';
      case 'approved':
        return 'checkmark-circle-outline';
      case 'rejected':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleViewSyllabus = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setShowSyllabusModal(true);
  };

  const handleEditSyllabus = (syllabus) => {
    router.push({
      pathname: '/users/faculty/SyllabiCreation',
      params: { syllabusId: syllabus.syllabusId }
    });
  };

  const handleDeleteSyllabus = (syllabus) => {
    Alert.alert(
      'Delete Syllabus',
      `Are you sure you want to delete "${syllabus.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: You might want to implement a soft delete instead
              Alert.alert('Success', 'Syllabus deleted successfully');
              fetchSyllabi(); // Refresh the list
            } catch (error) {
              console.error('Error deleting syllabus:', error);
              Alert.alert('Error', 'Failed to delete syllabus');
            }
          }
        }
      ]
    );
  };

  const handleCreateNew = () => {
    // For now, redirect to a new syllabus creation page
    // You might want to create a new page for creating syllabi from scratch
    Alert.alert('Info', 'Please assign a course first to create a syllabus');
  };

  const handleBack = () => {
    router.back();
  };

  const renderSyllabusCard = (syllabus) => {
    const statusColor = getStatusColor(syllabus.status);
    const statusIcon = getStatusIcon(syllabus.status);
    const statusText = getStatusText(syllabus.status);

    return (
      <View key={syllabus.id} style={styles.syllabusCard}>
        <View style={styles.cardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>{syllabus.courseCode}</Text>
            <Text style={styles.courseTitle}>{syllabus.courseTitle}</Text>
            <Text style={styles.sectionCode}>Section: {syllabus.sectionCode}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name={statusIcon} size={20} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.syllabusTitle}>{syllabus.title}</Text>
          {syllabus.description && (
            <Text style={styles.syllabusDescription}>{syllabus.description}</Text>
          )}
          
          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>Version: {syllabus.version}</Text>
            <Text style={styles.metaText}>Term: {syllabus.term}</Text>
            <Text style={styles.metaText}>Created: {formatDate(syllabus.dateCreated)}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{syllabus.selectedILOs.length}</Text>
              <Text style={styles.statLabel}>ILOs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{syllabus.assessments.length}</Text>
              <Text style={styles.statLabel}>Assessments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{syllabus.rubrics.length}</Text>
              <Text style={styles.statLabel}>Rubrics</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewSyllabus(syllabus)}
          >
            <Ionicons name="eye-outline" size={16} color="#475569" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {syllabus.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditSyllabus(syllabus)}
            >
              <Ionicons name="create-outline" size={16} color="#475569" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
          )}

          {syllabus.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteSyllabus(syllabus)}
            >
              <Ionicons name="trash-outline" size={16} color="#475569" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const safeText = (val) => {
    return val || 'N/A';
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      return new Date(val).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const renderSyllabusModal = () => {
    if (!selectedSyllabus) return null;

    return (
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
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Course Information</Text>
                <Text style={styles.detailLabel}>Course Code:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.courseCode)}</Text>
                
                <Text style={styles.detailLabel}>Course Title:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.courseTitle)}</Text>
                
                <Text style={styles.detailLabel}>Section:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.sectionCode)}</Text>
                
                <Text style={styles.detailLabel}>Term:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.term)}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Syllabus Information</Text>
                <Text style={styles.detailLabel}>Title:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.title)}</Text>
                
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.description)}</Text>
                
                <Text style={styles.detailLabel}>Version:</Text>
                <Text style={styles.detailValue}>{safeText(selectedSyllabus.version)}</Text>
                
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon(selectedSyllabus.status)} 
                    size={16} 
                    color={getStatusColor(selectedSyllabus.status)} 
                  />
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedSyllabus.status) }]}>
                    {getStatusText(selectedSyllabus.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Intended Learning Outcomes</Text>
                {selectedSyllabus.selectedILOs && selectedSyllabus.selectedILOs.length > 0 ? (
                  selectedSyllabus.selectedILOs.map((ilo, index) => (
                    <View key={index} style={styles.iloItem}>
                      <Text style={styles.iloCode}>{ilo.code}</Text>
                      <Text style={styles.iloDescription}>{ilo.description}</Text>
                      <View style={styles.iloMeta}>
                        <Text style={styles.iloMetaText}>Category: {ilo.category}</Text>
                        <Text style={styles.iloMetaText}>Level: {ilo.level}</Text>
                        <Text style={styles.iloMetaText}>Weight: {ilo.weight_percentage}%</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No ILOs defined</Text>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Assessments</Text>
                {selectedSyllabus.assessments && selectedSyllabus.assessments.length > 0 ? (
                  selectedSyllabus.assessments.map((assessment, index) => (
                    <View key={index} style={styles.assessmentItem}>
                      <Text style={styles.assessmentTitle}>{assessment.title}</Text>
                      <Text style={styles.assessmentDescription}>{assessment.description}</Text>
                      <View style={styles.assessmentMeta}>
                        <Text style={styles.assessmentMetaText}>Type: {assessment.type}</Text>
                        <Text style={styles.assessmentMetaText}>Points: {assessment.total_points}</Text>
                        <Text style={styles.assessmentMetaText}>Weight: {assessment.weight_percentage}%</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No assessments defined</Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => {
                    setShowSyllabusModal(false);
                    handleEditSyllabus(selectedSyllabus);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color="#007AFF" />
                  <Text style={styles.modalActionButtonText}>Edit Syllabus</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredSyllabi = getFilteredSyllabi();

  return (
    <SafeAreaView style={styles.container}>
      <FacultyMySyllabusHeader />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterTab,
                  selectedFilter === option.key && styles.filterTabActive
                ]}
                onPress={() => setSelectedFilter(option.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === option.key && styles.filterTabTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Syllabus Cards */}
        <View style={styles.cardsContainer}>
          {loading ? (
            <View style={styles.loadingState}>
              <Text>Loading syllabi...</Text>
            </View>
          ) : filteredSyllabi.length > 0 ? (
            filteredSyllabi.map(renderSyllabusCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No syllabi found</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'all' ? 'You haven\'t created any syllabi yet' :
                 selectedFilter === 'pending' ? 'No pending syllabi' :
                 selectedFilter === 'approved' ? 'No approved syllabi' :
                 'No rejected syllabi'}
              </Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Create New Syllabus</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding at the bottom for bottom navigation
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#475569',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#475569',
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  syllabusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // Remove all shadow/elevation properties for a flat look
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  courseTitle: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  sectionCode: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
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
  cardContent: {
    marginBottom: 12,
  },
  syllabusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  syllabusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
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
  modalBody: {
    flex: 1,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
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
  iloMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  iloMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  assessmentItem: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  assessmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  assessmentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  assessmentMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalActions: {
    marginTop: 20,
    alignItems: 'center',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
  },
}); 