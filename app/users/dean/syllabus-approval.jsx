import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useUser } from '../../../contexts/UserContext';
import { UserRole } from '../../../types/userRoles';
import { useModal } from '../../../utils/useModal';
import DeanSyllabusApprovalHeader from '../../components/DeanSyllabusApprovalHeader';

// Syllabus Card Component
const SyllabusCard = ({ approval, onApprove, onReject, onViewSyllabus, onCardPress }) => {
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
    <ClickableContainer style={styles.approvalCard} onPress={() => onCardPress(approval)}>
      <View style={styles.approvalHeader}>
        <View style={styles.facultyAvatar}>
          <Text style={styles.avatarText}>{approval.facultyName.charAt(0)}</Text>
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{approval.courseCode}</Text>
          <Text style={styles.courseTitle}>{approval.courseTitle}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(approval.status) }]} />
          <Text style={{ marginLeft: 8, color: getStatusColor(approval.status), fontWeight: 'bold' }}>{getStatusText(approval.status)}</Text>
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
  const { visible, selectedItem: selectedApproval, openModal, closeModal } = useModal();

  // Mock data for syllabus approvals
  const [syllabusApprovals] = useState([
    {
      id: 1,
      courseCode: 'CS101',
      courseTitle: 'Introduction to Computer Science',
      facultyName: 'Dr. John Doe',
      department: 'Computer Science',
      semester: 'Fall 2024',
      status: 'pending',
      submissionDate: '2024-01-15',
      lastModified: '2024-01-15',
      version: '1.0',
      documents: ['Syllabus.pdf', 'Course Outline.docx', 'Assessment Plan.pdf'],
      facultyProfile: {
        id: 'F001',
        name: 'Dr. John Doe',
        email: 'john.doe@university.edu',
        phone: '+1 (555) 123-4567',
        department: 'Computer Science',
        position: 'Associate Professor',
        specialization: 'Software Engineering, Database Systems',
        yearsOfExperience: 8,
        education: 'Ph.D. Computer Science, Stanford University',
        officeLocation: 'Room 301, Engineering Building',
        officeHours: 'Mon/Wed 2:00-4:00 PM',
        profileImage: null
      }
    },
    {
      id: 2,
      courseCode: 'MATH201',
      courseTitle: 'Calculus II',
      facultyName: 'Dr. Jane Smith',
      department: 'Mathematics',
      semester: 'Fall 2024',
      status: 'pending',
      submissionDate: '2024-01-14',
      lastModified: '2024-01-14',
      version: '1.0',
      documents: ['Syllabus.pdf', 'Course Schedule.xlsx'],
      facultyProfile: {
        id: 'F002',
        name: 'Dr. Jane Smith',
        email: 'jane.smith@university.edu',
        phone: '+1 (555) 234-5678',
        department: 'Mathematics',
        position: 'Assistant Professor',
        specialization: 'Calculus, Linear Algebra, Mathematical Analysis',
        yearsOfExperience: 5,
        education: 'Ph.D. Mathematics, MIT',
        officeLocation: 'Room 205, Science Building',
        officeHours: 'Tue/Thu 1:00-3:00 PM',
        profileImage: null
      }
    },
    {
      id: 3,
      courseCode: 'PHYS101',
      courseTitle: 'Physics Fundamentals',
      facultyName: 'Dr. Michael Johnson',
      department: 'Physics',
      semester: 'Fall 2024',
      status: 'approved',
      submissionDate: '2024-01-10',
      lastModified: '2024-01-10',
      version: '1.0',
      documents: ['Syllabus.pdf', 'Lab Manual.pdf'],
      facultyProfile: {
        id: 'F003',
        name: 'Dr. Michael Johnson',
        email: 'michael.johnson@university.edu',
        phone: '+1 (555) 345-6789',
        department: 'Physics',
        position: 'Professor',
        specialization: 'Quantum Mechanics, Thermodynamics',
        yearsOfExperience: 12,
        education: 'Ph.D. Physics, Caltech',
        officeLocation: 'Room 401, Science Building',
        officeHours: 'Mon/Wed/Fri 10:00-12:00 AM',
        profileImage: null
      }
    },
    {
      id: 4,
      courseCode: 'ENG101',
      courseTitle: 'English Composition',
      facultyName: 'Dr. Sarah Wilson',
      department: 'English',
      semester: 'Fall 2024',
      status: 'rejected',
      submissionDate: '2024-01-08',
      lastModified: '2024-01-08',
      version: '1.0',
      documents: ['Syllabus.pdf'],
      rejectionReason: 'Missing assessment criteria and learning objectives',
      facultyProfile: {
        id: 'F004',
        name: 'Dr. Sarah Wilson',
        email: 'sarah.wilson@university.edu',
        phone: '+1 (555) 456-7890',
        department: 'English',
        position: 'Lecturer',
        specialization: 'Creative Writing, Composition Studies',
        yearsOfExperience: 3,
        education: 'Ph.D. English Literature, Yale University',
        officeLocation: 'Room 102, Humanities Building',
        officeHours: 'Tue/Thu 3:00-5:00 PM',
        profileImage: null
      }
    }
  ]);

  // Show loading while app is initializing or user is loading
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, color: 'gray', textAlign: 'center' }}>
          {!isInitialized ? 'Initializing...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // Only redirect if we're sure the user is not a dean
  if (isInitialized && !isLoading && (!currentUser || currentUser.role !== UserRole.DEAN)) {
    setTimeout(() => {
      router.replace('/public');
    }, 100);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, color: 'gray', textAlign: 'center' }}>Redirecting...</Text>
      </View>
    );
  }

  const filteredApprovals = syllabusApprovals.filter(approval => {
    if (selectedFilter === 'all') return true;
    return approval.status === selectedFilter;
  });

  const handleApprove = (id) => {
    // Handle approval logic here
    console.log('Approving syllabus:', id);
    closeModal();
  };

  const handleReject = (id) => {
    // Handle rejection logic here
    console.log('Rejecting syllabus:', id);
    closeModal();
  };

  const handleViewSyllabus = (id) => {
    // Handle viewing syllabus logic here
    console.log('Viewing syllabus:', id);
  };

  const handleSearch = () => {
    // Handle search logic here
    console.log('Searching for:', searchTerm);
  };

  const handleCardPress = (approval) => {
    openModal(approval);
  };

  const renderSyllabusModal = () => {
    if (!selectedApproval) return null;

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

    const modalFooter = selectedApproval.status === 'pending' ? (
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalViewButton]}
          onPress={() => handleViewSyllabus(selectedApproval.id)}
        >
          <Ionicons name="eye-outline" size={16} color="#DC2626" />
          <Text style={styles.modalViewButtonText}>View Syllabus</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalApproveButton]}
          onPress={() => handleApprove(selectedApproval.id)}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
          <Text style={styles.modalApproveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalRejectButton]}
          onPress={() => handleReject(selectedApproval.id)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.modalRejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalViewButton]}
          onPress={() => handleViewSyllabus(selectedApproval.id)}
        >
          <Ionicons name="eye-outline" size={16} color="#DC2626" />
          <Text style={styles.modalViewButtonText}>View Syllabus</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <ModalContainer
        visible={visible}
        onClose={closeModal}
        title="Syllabus Details"
        footer={modalFooter}
      >
        <View style={styles.modalContent}>
          {/* Course Header */}
          <View style={styles.modalCourseHeader}>
            <View style={styles.modalFacultyAvatar}>
              <Text style={styles.modalAvatarText}>{selectedApproval.facultyName.charAt(0)}</Text>
            </View>
            <View style={styles.modalCourseInfo}>
              <Text style={styles.modalCourseCode}>{selectedApproval.courseCode}</Text>
              <Text style={styles.modalCourseTitle}>{selectedApproval.courseTitle}</Text>
              <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedApproval.status) }]}>
                <Text style={styles.modalStatusText}>{getStatusText(selectedApproval.status)}</Text>
              </View>
            </View>
          </View>

          {/* Syllabus Details */}
          <View style={styles.modalDetails}>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="person-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Faculty:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.facultyName}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="school-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Department:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.department}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Semester:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.semester}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Version:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.version}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Submitted:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.submissionDate}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="refresh-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Last Modified:</Text>
                <Text style={styles.modalDetailValue}>{selectedApproval.lastModified}</Text>
              </View>
            </View>
          </View>

          {/* Documents */}
          <View style={styles.modalDocuments}>
            <Text style={styles.modalDocumentsTitle}>Documents:</Text>
            {selectedApproval.documents.map((doc, index) => (
              <View key={index} style={styles.modalDocumentItem}>
                <Ionicons name="document-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDocumentText}>{doc}</Text>
              </View>
            ))}
          </View>

          {/* Faculty Profile */}
          <View style={styles.modalFacultyProfile}>
            <Text style={styles.modalFacultyTitle}>Faculty Profile:</Text>
            <View style={styles.modalFacultyDetails}>
              <View style={styles.modalFacultyDetailRow}>
                <Text style={styles.modalFacultyDetailLabel}>Name:</Text>
                <Text style={styles.modalFacultyDetailValue}>{selectedApproval.facultyProfile.name}</Text>
              </View>
              <View style={styles.modalFacultyDetailRow}>
                <Text style={styles.modalFacultyDetailLabel}>Email:</Text>
                <Text style={styles.modalFacultyDetailValue}>{selectedApproval.facultyProfile.email}</Text>
              </View>
              <View style={styles.modalFacultyDetailRow}>
                <Text style={styles.modalFacultyDetailLabel}>Position:</Text>
                <Text style={styles.modalFacultyDetailValue}>{selectedApproval.facultyProfile.position}</Text>
              </View>
              <View style={styles.modalFacultyDetailRow}>
                <Text style={styles.modalFacultyDetailLabel}>Experience:</Text>
                <Text style={styles.modalFacultyDetailValue}>{selectedApproval.facultyProfile.yearsOfExperience} years</Text>
              </View>
            </View>
          </View>

          {/* Rejection Reason */}
          {selectedApproval.rejectionReason && (
            <View style={styles.modalRejectionSection}>
              <Text style={styles.modalRejectionTitle}>Rejection Reason:</Text>
              <Text style={styles.modalRejectionReason}>{selectedApproval.rejectionReason}</Text>
            </View>
          )}
        </View>
      </ModalContainer>
    );
  };

  return (
    <View style={styles.container}>
      <DeanSyllabusApprovalHeader
        showContainers={showContainers}
        setShowContainers={setShowContainers}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {showContainers && (
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Filter by Status</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('pending')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'approved' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('approved')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'approved' && styles.filterButtonTextActive]}>
                  Approved
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'rejected' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('rejected')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'rejected' && styles.filterButtonTextActive]}>
                  Rejected
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.approvalsList}>
          {filteredApprovals.map((approval) => (
            <SyllabusCard
              key={approval.id}
              approval={approval}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewSyllabus={handleViewSyllabus}
              onCardPress={handleCardPress}
            />
          ))}
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
  approvalsList: {
    gap: 12,
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
  modalCourseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalFacultyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  modalCourseInfo: {
    flex: 1,
  },
  modalCourseCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  modalCourseTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailRow: {
    marginBottom: 8,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    width: 100,
    flexShrink: 0,
    marginLeft: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  modalDocuments: {
    marginBottom: 20,
  },
  modalDocumentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  modalDocumentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalDocumentText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  modalFacultyProfile: {
    marginBottom: 20,
  },
  modalFacultyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  modalFacultyDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  modalFacultyDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  modalFacultyDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    width: 80,
    flexShrink: 0,
  },
  modalFacultyDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  modalRejectionSection: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  modalRejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  modalRejectionReason: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  modalViewButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  modalApproveButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  modalRejectButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  modalViewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalApproveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  modalRejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
}); 