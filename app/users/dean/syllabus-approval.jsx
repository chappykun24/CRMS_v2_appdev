import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useUser } from '../../../contexts/UserContext';
import { UserRole } from '../../../types/userRoles';
import apiClient from '../../../utils/api';
import { useModal } from '../../../utils/useModal';
import DeanSyllabusApprovalHeader from '../../components/DeanSyllabusApprovalHeader';

// Syllabus Card Component
const SyllabusCard = ({ syllabus, onApprove, onReject, onViewSyllabus, onCardPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#F59E0B'; // Amber for pending
      case 'approved':
        return '#10B981'; // Green for approved
      case 'rejected':
        return '#EF4444'; // Red for rejected
      default:
        return '#6B7280'; // Gray for unknown
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

  return (
    <ClickableContainer style={styles.approvalCard} onPress={() => onCardPress(syllabus)}>
      <View style={styles.approvalHeader}>
        <View style={styles.facultyAvatar}>
          <Text style={styles.avatarText}>{syllabus.faculty_name?.charAt(0) || 'F'}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{syllabus.course_code}</Text>
          <Text style={styles.courseTitle}>{syllabus.course_title}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(syllabus.approval_status) }]} />
          <Text style={{ marginLeft: 8, color: getStatusColor(syllabus.approval_status), fontWeight: 'bold' }}>
            {getStatusText(syllabus.approval_status)}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.expandIcon} />
        </View>
      </View>
    </ClickableContainer>
  );
};

export default function DeanSyllabusApproval() {
  const { currentUser, isLoading, isInitialized } = useUser();
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [isTableView, setIsTableView] = useState(false);
  const [showContainers, setShowContainers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const { visible, selectedItem: selectedSyllabus, openModal, closeModal } = useModal();

  // Fetch syllabi based on filter
  useEffect(() => {
    fetchSyllabi();
  }, [selectedFilter]);

  const fetchSyllabi = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      
      switch (selectedFilter) {
        case 'pending':
          endpoint = '/syllabus/pending';
          break;
        case 'approved':
          endpoint = '/syllabus/approved';
          break;
        case 'rejected':
          endpoint = '/syllabus/rejected';
          break;
        default:
          endpoint = '/syllabus/all';
      }
      
      const response = await apiClient.get(endpoint);
      setSyllabi(response);
    } catch (error) {
      console.error('Error fetching syllabi:', error);
      Alert.alert('Error', 'Failed to fetch syllabi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (syllabusId) => {
    try {
      await apiClient.put(`/syllabus/approval-status/${syllabusId}`, {
        reviewed_by: currentUser.user_id,
        approval_status: 'approved'
      });
      
      Alert.alert('Success', 'Syllabus approved successfully');
      fetchSyllabi(); // Refresh the list
    } catch (error) {
      console.error('Error approving syllabus:', error);
      Alert.alert('Error', 'Failed to approve syllabus');
    }
  };

  const handleReject = async (syllabusId) => {
    try {
      await apiClient.put(`/syllabus/approval-status/${syllabusId}`, {
        reviewed_by: currentUser.user_id,
        approval_status: 'rejected'
      });
      
      Alert.alert('Success', 'Syllabus rejected');
      fetchSyllabi(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting syllabus:', error);
      Alert.alert('Error', 'Failed to reject syllabus');
    }
  };

  const handleViewSyllabus = (syllabusId) => {
    router.push({
      pathname: '/users/faculty/SyllabiCreation',
      params: { syllabusId: syllabusId }
    });
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchTerm);
  };

  const handleCardPress = (syllabus) => {
    openModal(syllabus);
  };

  const renderSyllabusModal = () => {
    if (!selectedSyllabus) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending':
          return '#F59E0B';
        case 'approved':
          return '#10B981';
        case 'rejected':
          return '#EF4444';
        default:
          return '#6B7280';
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

    return (
      <ModalContainer visible={visible} onClose={closeModal}>
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Syllabus Details</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.syllabusInfo}>
            <Text style={styles.infoLabel}>Course Code:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.course_code}</Text>

            <Text style={styles.infoLabel}>Course Title:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.course_title}</Text>

            <Text style={styles.infoLabel}>Faculty:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.faculty_name}</Text>

            <Text style={styles.infoLabel}>Section:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.section_code}</Text>

            <Text style={styles.infoLabel}>School Year:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.school_year} {selectedSyllabus.semester}</Text>

            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedSyllabus.approval_status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(selectedSyllabus.approval_status) }]}>
                {getStatusText(selectedSyllabus.approval_status)}
              </Text>
            </View>

            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>{selectedSyllabus.version}</Text>

            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(selectedSyllabus.created_at).toLocaleDateString()}
            </Text>

            {selectedSyllabus.reviewer_name && (
              <>
                <Text style={styles.infoLabel}>Reviewed by:</Text>
                <Text style={styles.infoValue}>{selectedSyllabus.reviewer_name}</Text>
              </>
            )}

            {selectedSyllabus.approver_name && (
              <>
                <Text style={styles.infoLabel}>Approved by:</Text>
                <Text style={styles.infoValue}>{selectedSyllabus.approver_name}</Text>
              </>
            )}
          </View>

          <View style={styles.iloSection}>
            <Text style={styles.sectionTitle}>Intended Learning Outcomes</Text>
            {selectedSyllabus.ilos && selectedSyllabus.ilos.length > 0 ? (
              selectedSyllabus.ilos.map((ilo, index) => (
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

          <View style={styles.assessmentSection}>
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

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => {
                closeModal();
                handleViewSyllabus(selectedSyllabus.syllabus_id);
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
              <Text style={styles.viewButtonText}>View Full Syllabus</Text>
            </TouchableOpacity>

            {selectedSyllabus.approval_status === 'pending' && (
              <View style={styles.approvalButtons}>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={() => {
                    closeModal();
                    handleReject(selectedSyllabus.syllabus_id);
                  }}
                >
                  <Ionicons name="close-outline" size={20} color="#EF4444" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.approveButton}
                  onPress={() => {
                    closeModal();
                    handleApprove(selectedSyllabus.syllabus_id);
                  }}
                >
                  <Ionicons name="checkmark-outline" size={20} color="#10B981" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </ModalContainer>
    );
  };

  // Filter options
  const filterOptions = [
    { key: 'pending', label: 'Pending', count: syllabi.filter(s => s.approval_status === 'pending').length },
    { key: 'approved', label: 'Approved', count: syllabi.filter(s => s.approval_status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: syllabi.filter(s => s.approval_status === 'rejected').length },
    { key: 'all', label: 'All', count: syllabi.length }
  ];

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (currentUser?.role !== UserRole.DEAN) {
    router.replace('/');
    return null;
  }

  return (
    <View style={styles.container}>
      <DeanSyllabusApprovalHeader />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map((option) => (
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
                <View style={[
                  styles.filterCount,
                  selectedFilter === option.key && styles.filterCountActive
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === option.key && styles.filterCountTextActive
                  ]}>
                    {option.count}
                  </Text>
                </View>
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
          ) : syllabi.length > 0 ? (
            syllabi.map((syllabus) => (
              <SyllabusCard
                key={syllabus.syllabus_id}
                syllabus={syllabus}
                onApprove={() => handleApprove(syllabus.syllabus_id)}
                onReject={() => handleReject(syllabus.syllabus_id)}
                onViewSyllabus={() => handleViewSyllabus(syllabus.syllabus_id)}
                onCardPress={handleCardPress}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No syllabi found</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'pending' ? 'No pending syllabi for approval' :
                 selectedFilter === 'approved' ? 'No approved syllabi' :
                 selectedFilter === 'rejected' ? 'No rejected syllabi' :
                 'No syllabi available'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderSyllabusModal()}
    </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  filterCountActive: {
    backgroundColor: '#FFFFFF',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterCountTextActive: {
    color: '#DC2626',
  },
  cardsContainer: {
    gap: 12,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  facultyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  expandIcon: {
    marginLeft: 4,
  },
  // Modal Styles
  modalContent: {
    padding: 16,
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
  syllabusInfo: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  iloSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  iloItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  iloCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  iloDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  iloMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  iloMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  assessmentSection: {
    marginBottom: 20,
  },
  assessmentItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    marginTop: 4,
  },
  assessmentMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    marginTop: 20,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
}); 