import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useUser } from '../../../contexts/UserContext';
import { useModal } from '../../../utils/useModal';
import ProgramChairSubmissionsHeader from '../../components/ProgramChairSubmissionsHeader';

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

export default function ReviewSubmissions() {
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
        officeHours: 'Mon/Wed/Fri 10:00-12:00 PM',
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

  const handleSearch = () => {
    // Search functionality can be implemented here
    console.log('Searching for:', searchTerm);
  };

  // Filter approvals based on selected status and search term
  const filteredApprovals = syllabusApprovals.filter(approval => {
    // First filter by status
    const statusMatch = selectedFilter === 'all' || approval.status === selectedFilter;
    
    // Then filter by search term
    const searchMatch = !searchTerm || 
      approval.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const handleApprove = (id) => {
    // Handle approval logic here
    console.log('Program Chair approving submission:', id);
    closeModal();
  };

  const handleReject = (id) => {
    // Handle rejection logic here
    console.log('Program Chair rejecting submission:', id);
    closeModal();
  };

  const handleViewSyllabus = (id) => {
    // Handle viewing syllabus logic here
    console.log('Program Chair viewing submission:', id);
  };

  const handleCardPress = (approval) => {
    openModal(approval);
  };

  const renderSubmissionModal = () => {
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
        title="Submission Details"
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

          {/* Submission Details */}
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ProgramChairSubmissionsHeader
        showContainers={showContainers}
        setShowContainers={setShowContainers}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
      />
      
      <View style={styles.content}>
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
          {isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="refresh" size={32} color="#DC2626" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Loading submissions...</Text>
            </View>
          ) : filteredApprovals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No submissions found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filter or check back later</Text>
            </View>
          ) : isTableView ? (
            <ScrollView style={styles.tableView} horizontal={true}>
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, {width: 120}]}>Course Code</Text>
                  <Text style={[styles.tableHeaderCell, {width: 220}]}>Course Title</Text>
                  <Text style={[styles.tableHeaderCell, {width: 160}]}>Faculty</Text>
                  <Text style={[styles.tableHeaderCell, {width: 160}]}>Department</Text>
                  <Text style={[styles.tableHeaderCell, {width: 120}]}>Semester</Text>
                  <Text style={[styles.tableHeaderCell, {width: 100}]}>Status</Text>
                </View>
                {filteredApprovals.map((approval, idx) => (
                  <View key={approval.id || idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, {width: 120}]}>{approval.courseCode}</Text>
                    <Text style={[styles.tableCell, {width: 220}]}>{approval.courseTitle}</Text>
                    <Text style={[styles.tableCell, {width: 160}]}>{approval.facultyName}</Text>
                    <Text style={[styles.tableCell, {width: 160}]}>{approval.department}</Text>
                    <Text style={[styles.tableCell, {width: 120}]}>{approval.semester}</Text>
                    <Text style={[styles.tableCell, {width: 100}]}>{approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            filteredApprovals.map((approval) => (
              <SyllabusCard
                key={approval.id}
                approval={approval}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewSyllabus={handleViewSyllabus}
                onCardPress={handleCardPress}
              />
            ))
          )}
        </View>
      </View>
      {renderSubmissionModal()}
    </ScrollView>
  );
}

const styles = {
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
  },
  filterButtonText: {
    color: '#353A40',
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  approvalsList: {
    marginTop: 8,
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facultyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
  },
  courseTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  expandIcon: {
    marginLeft: 8,
  },
  tableView: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 14,
    marginRight: 8,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 13,
    color: '#353A40',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
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
}; 