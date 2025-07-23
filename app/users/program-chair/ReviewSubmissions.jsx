import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api'; // adjust path as needed
import ProgramChairSubmissionsHeader from '../../components/ProgramChairSubmissionsHeader';

// Syllabus Card Component
const SyllabusCard = ({ approval, onCardPress }) => {
  let statusLabel = 'Pending Review';
  if (approval.review_status === 'approved' && approval.approval_status === 'pending') {
    statusLabel = 'Pending for Dean Approval';
  } else if (approval.review_status === 'approved' && approval.approval_status === 'approved') {
    statusLabel = 'Approved';
  } else if (approval.review_status === 'rejected' || approval.approval_status === 'rejected') {
    statusLabel = 'Rejected';
  }
  return (
    <TouchableOpacity style={styles.card} onPress={() => onCardPress(approval)} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{approval.course_title} <Text style={styles.cardCode}>({approval.course_code})</Text></Text>
          <Text style={styles.cardTerm}>{approval.semester} {approval.school_year}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ReviewSubmissions() {
  const { currentUser, isLoading, isInitialized } = useUser();
  const [syllabusApprovals, setSyllabusApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [isTableView, setIsTableView] = useState(false);
  const [showContainers, setShowContainers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient.get('/syllabus/pending')
      .then(data => {
        console.log('Fetched pending syllabi:', data);
        data.forEach(syl => {
          console.log(`syllabus_id: ${syl.syllabus_id}, review_status: ${syl.review_status}, approval_status: ${syl.approval_status}`);
        });
        setSyllabusApprovals(Array.isArray(data) ? data : []);
      })
      .catch(() => setSyllabusApprovals([]))
      .finally(() => setLoading(false));
  }, []);

  if (!isInitialized || isLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontSize: 24, color: 'gray', textAlign: 'center' }}>
          {!isInitialized ? 'Initializing...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  const handleViewSyllabus = (syllabus) => {
    setSelectedSyllabus(syllabus);
    setShowSyllabusModal(true);
  };

  const safeText = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
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
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const date = new Date(val.replace(' ', 'T'));
      if (!isNaN(date)) {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
    return String(val);
  };

  const getStatusText = (status, review_status, approval_status) => {
    if (review_status === 'approved' && approval_status === 'pending') return 'Pending for Dean Approval';
    if (review_status === 'approved' && approval_status === 'approved') return 'Approved';
    if (review_status === 'rejected' || approval_status === 'rejected') return 'Rejected';
    if (review_status === 'pending') return 'Pending Review';
    return 'Unknown';
  };

  const handleApprove = (id) => {
    const syllabus = syllabusApprovals.find(syl => syl.syllabus_id === id);
    if (!syllabus) {
      Alert.alert('Error', 'Syllabus not found.');
      return;
    }
    if (syllabus.review_status === 'approved') {
      Alert.alert('Already Approved', 'This syllabus has already been approved.');
      return;
    }
    Alert.alert(
      'Approve Syllabus',
      'Are you sure you want to approve this syllabus for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              const url = `/syllabus/approval-status/${id}`;
              const payload = { reviewed_by: currentUser.user_id };
              console.log('Approving syllabus:', { url, payload });
              await apiClient.put(url, payload);
              setSyllabusApprovals(prev => prev.map(syl =>
                syl.syllabus_id === id
                  ? { ...syl, review_status: 'approved', reviewed_by: currentUser.user_id, reviewed_at: new Date().toISOString() }
                  : syl
              ));
              setShowSyllabusModal(false);
              Alert.alert('Success', 'Syllabus approved for review.');
            } catch (err) {
              console.log('Error approving syllabus:', err);
              Alert.alert('Error', 'Failed to approve syllabus.');
            }
          }
        }
      ]
    );
  };

  const handleReject = (id) => {
    const syllabus = syllabusApprovals.find(syl => syl.syllabus_id === id);
    if (!syllabus) {
      Alert.alert('Error', 'Syllabus not found.');
      return;
    }
    if (syllabus.review_status === 'rejected') {
      Alert.alert('Already Rejected', 'This syllabus has already been rejected.');
      return;
    }
    Alert.alert(
      'Reject Syllabus',
      'Are you sure you want to reject this syllabus?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = `/syllabus/approval-status/${id}`;
              const payload = { reviewed_by: currentUser.user_id, review_status: 'rejected' };
              console.log('Rejecting syllabus:', { url, payload });
              await apiClient.put(url, payload);
              setSyllabusApprovals(prev => prev.map(syl =>
                syl.syllabus_id === id
                  ? { ...syl, review_status: 'rejected', reviewed_by: currentUser.user_id, reviewer_name: currentUser.name, reviewed_at: new Date().toISOString() }
                  : syl
              ));
              setShowSyllabusModal(false);
              Alert.alert('Rejected', 'Syllabus has been rejected.');
            } catch (err) {
              console.log('Error rejecting syllabus:', err);
              Alert.alert('Error', 'Failed to reject syllabus.');
            }
          }
        }
      ]
    );
  };

  const renderSyllabusModal = () => {
    const fields = selectedSyllabus ? [
      { label: 'Course Code', value: selectedSyllabus.course_code },
      { label: 'Course Title', value: selectedSyllabus.course_title },
      { label: 'Term', value: selectedSyllabus.school_year && selectedSyllabus.semester ? `${selectedSyllabus.school_year} ${selectedSyllabus.semester}` : '' },
      { label: 'Syllabus Title', value: selectedSyllabus.title },
      { label: 'Status', value: getStatusText(selectedSyllabus.approval_status, selectedSyllabus.review_status, selectedSyllabus.approval_status) },
      { label: 'Reviewed By', value: selectedSyllabus.reviewer_name || selectedSyllabus.reviewed_by || 'N/A' },
      { label: 'Approved By', value: selectedSyllabus.approved_by },
      { label: 'Date Created', value: safeText(selectedSyllabus.created_at) },
      { label: 'Date Reviewed', value: safeText(selectedSyllabus.reviewed_at) },
      { label: 'Date Approved', value: (!selectedSyllabus.approved_at || selectedSyllabus.approved_at === 'null') ? 'Pending' : (safeText(selectedSyllabus.approved_at) || 'Pending') },
    ] : [];
    const isRejected = selectedSyllabus && (selectedSyllabus.review_status === 'rejected' || selectedSyllabus.approval_status === 'rejected');
    return (
      <Modal
        visible={showSyllabusModal && !!selectedSyllabus}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSyllabusModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 300, maxWidth: 380, width: '90%', maxHeight: '85%', alignItems: 'stretch', elevation: 4 }}>
            <TouchableOpacity
              onPress={() => setShowSyllabusModal(false)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: 6 }}
            >
              <Ionicons name="close" size={24} color="#DC2626" />
            </TouchableOpacity>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 18, alignSelf: 'center', color: '#DC2626' }}>Syllabus Details</Text>
              {selectedSyllabus && (
                <>
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#1E293B', marginBottom: 12, letterSpacing: 0.5 }}>Syllabus Information</Text>
                    {fields.map((field, idx) => (
                      <View key={field.label} style={{ flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' }}>
                        <Text style={{ fontWeight: '600', minWidth: 130, color: '#334155', fontSize: 14 }}>{field.label}:</Text>
                        <Text style={{ flex: 1, color: '#0F172A', fontSize: 14, fontWeight: '400' }}>{safeText(field.value)}</Text>
                      </View>
                    ))}
                  </View>
                  {Array.isArray(selectedSyllabus.ilos) && selectedSyllabus.ilos.length > 0 && (
                    <View style={{ marginBottom: 24, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 14 }}>
                      <Text style={{ fontWeight: 'bold', color: '#DC2626', marginBottom: 8, fontSize: 15, letterSpacing: 0.5 }}>Intended Learning Outcomes (ILOs)</Text>
                      {selectedSyllabus.ilos.map(ilo => (
                        <View key={safeText(ilo.ilo_id)} style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '600' }}>{ilo.ilo_code}</Text>
                          <Text style={{ fontSize: 13, color: '#475569', marginLeft: 10 }}>{ilo.ilo_description}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {Array.isArray(selectedSyllabus.assessments) && selectedSyllabus.assessments.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ fontWeight: 'bold', color: '#DC2626', marginBottom: 10, fontSize: 15, letterSpacing: 0.5 }}>Assessments</Text>
                      {selectedSyllabus.assessments.map(assess => (
                        <View key={assess.id} style={{ backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 16, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, color: '#1E293B', fontWeight: 'bold', letterSpacing: 0.2 }}>{assess.title}</Text>
                          </View>
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
                  {/* Approve/Reject Buttons */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 12 }}>
                    {isRejected && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginRight: 8 }}
                        onPress={() => handleApprove(selectedSyllabus.syllabus_id)}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Approve</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }}
                      onPress={() => handleReject(selectedSyllabus.syllabus_id)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const handleSearch = () => {
    // Search functionality can be implemented here
    console.log('Searching for:', searchTerm);
  };

  // Filter syllabi by selected review_status
  const filteredSyllabi = syllabusApprovals.filter(syl => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') {
      // Syllabi filled by faculty, awaiting Program Chair review
      return syl.review_status === 'pending';
    }
    if (selectedFilter === 'approved') {
      // Syllabi reviewed by Program Chair, awaiting Dean approval
      return syl.review_status === 'approved' && syl.approval_status === 'pending';
    }
    if (selectedFilter === 'rejected') {
      // Syllabi rejected by Program Chair
      return syl.review_status === 'rejected' || syl.approval_status === 'rejected';
    }
    return false;
  });

  const handleCardPress = (approval) => {
    // openModal(approval); // This was for the old modal, now handled by setShowSyllabusModal(true)
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
            <Text style={styles.filterTitle}>Filter by Review Status</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('pending')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'approved' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('approved')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'approved' && styles.filterButtonTextActive]}>Pending for Dean Approval</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, selectedFilter === 'rejected' && styles.filterButtonActive]}
                onPress={() => setSelectedFilter('rejected')}
              >
                <Text style={[styles.filterButtonText, selectedFilter === 'rejected' && styles.filterButtonTextActive]}>Rejected</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.approvalsList}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="refresh" size={32} color="#DC2626" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Loading submissions...</Text>
            </View>
          ) : filteredSyllabi.length === 0 ? (
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
                {filteredSyllabi.map((approval, idx) => (
                  <View key={approval.syllabus_id || idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, {width: 120}]}>{approval.course_code}</Text>
                    <Text style={[styles.tableCell, {width: 220}]}>{approval.course_title}</Text>
                    <Text style={[styles.tableCell, {width: 160}]}>{approval.faculty_name}</Text>
                    <Text style={[styles.tableCell, {width: 160}]}>{approval.department}</Text>
                    <Text style={[styles.tableCell, {width: 120}]}>{approval.semester} {approval.school_year}</Text>
                    <Text style={[styles.tableCell, {width: 100}]}>{approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            filteredSyllabi.map((approval) => (
              <SyllabusCard key={approval.syllabus_id} approval={approval} onCardPress={handleViewSyllabus} />
            ))
          )}
        </View>
      </View>
      {renderSyllabusModal()}
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
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  cardCode: {
    color: '#6B7280',
    fontWeight: 'normal',
    fontSize: 15,
  },
  cardTerm: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 13,
  },
}); 