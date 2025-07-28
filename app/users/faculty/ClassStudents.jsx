import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModalContainer from '../../../components/ModalContainer';
import apiClient, { getAPIBaseURL } from '../../../utils/api.js';
import FacultyMyClassesHeader from '../../components/FacultyMyClassesHeader';

export default function FacultyClassStudents() {
  const { section_course_id } = useLocalSearchParams();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTableView, setIsTableView] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loadingStudentData, setLoadingStudentData] = useState(false);

  useEffect(() => {
    if (!section_course_id) return;
    setLoading(true);
    apiClient.get(`/section-courses/${section_course_id}/students`)
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setStudents([]);
        setLoading(false);
      });
  }, [section_course_id]);

  const filteredStudents = students.filter(student =>
    (student.name || student.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.enrollment_id || '').toString().includes(search)
  );

  const handleStudentPress = async (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
    setLoadingStudentData(true);
    
    try {
      // Fetch comprehensive student data
      const data = await apiClient.get(`/students/${student.enrollment_id}/comprehensive-data`);
      setStudentData(data);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setStudentData(null);
    } finally {
      setLoadingStudentData(false);
    }
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
    setStudentData(null);
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return '#10B981'; // Green
    if (grade >= 80) return '#3B82F6'; // Blue
    if (grade >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#10B981'; // Green
    if (rate >= 80) return '#3B82F6'; // Blue
    if (rate >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'excuse': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'excuse': return 'Excused';
      default: return 'Not Marked';
    }
  };

  const renderProgressBar = (percentage, color) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { backgroundColor: '#E5E7EB' }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${Math.min(percentage, 100)}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
              <Text style={styles.progressText}>{typeof percentage === 'number' ? percentage.toFixed(1) : '0.0'}%</Text>
    </View>
  );

  const renderTableView = () => (
    <View style={styles.tableViewContainer}>
      <View style={styles.scrollIndicator}>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
        <Text style={styles.scrollIndicatorText}>Scroll to see more</Text>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
      </View>
      <ScrollView style={styles.tableView} horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>Photo</Text>
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>SR Code</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Enrollment Date</Text>
            <Text style={[styles.tableHeaderCell, { width: 100 }]}>Status</Text>
          </View>
          {filteredStudents.map(student => (
            <View key={student.enrollment_id} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 60, alignItems: 'center' }]}>
                {student.student_photo ? (
                  <Image 
                    source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }} 
                    style={styles.tableStudentPhoto}
                    onError={(error) => console.log('Image load error:', error)}
                  />
                ) : (
                  <View style={styles.tableDefaultAvatar}>
                    <Ionicons name="person" size={16} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>{student.full_name || student.name || 'Unnamed Student'}</Text>
              <Text style={[styles.tableCell, { width: 120 }]}>{student.student_number || 'N/A'}</Text>
              <Text style={[styles.tableCell, { width: 180 }]}>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleString() : '—'}</Text>
              <Text style={[styles.tableCell, { width: 100 }]}>{student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : '—'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <FacultyMyClassesHeader
        title="Enrolled Students"
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
      />
      {isTableView ? (
        renderTableView()
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <Text style={styles.info}>Loading students...</Text>
          ) : filteredStudents.length === 0 ? (
            <Text style={styles.info}>No students enrolled in this class.</Text>
          ) : (
            filteredStudents.map(student => (
              <TouchableOpacity key={student.enrollment_id} style={styles.studentCard} onPress={() => handleStudentPress(student)}>
                <View style={styles.studentHeader}>
                  <View style={styles.studentPhotoContainer}>
                    {student.student_photo ? (
                      <Image 
                        source={{ uri: `${getAPIBaseURL().replace('/api', '')}${student.student_photo}` }} 
                        style={styles.studentPhoto}
                        onError={(error) => console.log('Image load error:', error)}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.full_name || student.name || 'Unnamed Student'}</Text>
                    <Text style={styles.studentId}>SR Code: {student.student_number || 'N/A'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      <ModalContainer
        visible={showStudentModal}
        onClose={closeStudentModal}
        title="Student Details"
      >
        {selectedStudent && (
          <View style={styles.modalContent}>
            <View style={styles.modalStudentHeader}>
              <View style={styles.modalStudentPhotoContainer}>
                {selectedStudent.student_photo ? (
                  <Image 
                    source={{ uri: `${getAPIBaseURL().replace('/api', '')}${selectedStudent.student_photo}` }} 
                    style={styles.modalStudentPhoto}
                    onError={(error) => console.log('Image load error:', error)}
                  />
                ) : (
                  <View style={styles.modalDefaultAvatar}>
                    <Ionicons name="person" size={32} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={styles.modalStudentInfo}>
                <Text style={styles.modalStudentName}>{selectedStudent.full_name || selectedStudent.name || 'Unnamed Student'}</Text>
                <Text style={styles.modalStudentId}>SR Code: {selectedStudent.student_number || 'N/A'}</Text>
                {selectedStudent.email && <Text style={styles.modalStudentEmail}>Email: {selectedStudent.email}</Text>}
                {selectedStudent.status && <Text style={styles.modalStudentStatus}>Status: {selectedStudent.status}</Text>}
              </View>
            </View>

            {loadingStudentData ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading student data...</Text>
              </View>
            ) : studentData ? (
              <View style={styles.dataContainer}>
                {/* Overall Performance Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Overall Performance</Text>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceCard}>
                      <Text style={styles.performanceLabel}>Current Grade</Text>
                      <Text style={[styles.performanceValue, { color: getGradeColor(studentData.student.overall_grade) }]}>
                        {studentData.student.overall_grade}%
                      </Text>
                      {renderProgressBar(studentData.student.overall_grade, getGradeColor(studentData.student.overall_grade))}
                    </View>
                    <View style={styles.performanceCard}>
                      <Text style={styles.performanceLabel}>Attendance Rate</Text>
                      <Text style={[styles.performanceValue, { color: getAttendanceColor(studentData.attendance.attendance_rate) }]}>
                        {studentData.attendance.attendance_rate}%
                      </Text>
                      {renderProgressBar(studentData.attendance.attendance_rate, getAttendanceColor(studentData.attendance.attendance_rate))}
                    </View>
                  </View>
                </View>

                {/* Attendance Details Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attendance Details</Text>
                  <View style={styles.attendanceStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Total Sessions</Text>
                      <Text style={styles.statValue}>{studentData.attendance.total_sessions}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Present</Text>
                      <Text style={[styles.statValue, { color: '#10B981' }]}>{studentData.attendance.present_count}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Absent</Text>
                      <Text style={[styles.statValue, { color: '#EF4444' }]}>{studentData.attendance.absent_count}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Late</Text>
                      <Text style={[styles.statValue, { color: '#F59E0B' }]}>{studentData.attendance.late_count}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Excused</Text>
                      <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{studentData.attendance.excused_count}</Text>
                    </View>
                  </View>
                </View>

                {/* Recent Attendance Section */}
                {studentData.attendance.recent_records && studentData.attendance.recent_records.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Attendance</Text>
                    {studentData.attendance.recent_records.slice(0, 5).map((record, index) => (
                      <View key={index} style={styles.attendanceRecord}>
                        <View style={styles.attendanceRecordHeader}>
                          <Text style={styles.sessionTitle}>{record.session_title}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                              {getStatusText(record.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.sessionDate}>
                          {new Date(record.session_date).toLocaleDateString()} - {record.session_type}
                        </Text>
                        {record.remarks && <Text style={styles.remarks}>Remarks: {record.remarks}</Text>}
                      </View>
                    ))}
                  </View>
                )}

                {/* Sub-Assessment Grades Section */}
                {studentData.grades.sub_assessments && studentData.grades.sub_assessments.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assessment Grades</Text>
                    <View style={styles.gradesContainer}>
                      {studentData.grades.sub_assessments.map((subAssessment, index) => (
                        <View key={index} style={styles.gradeCard}>
                          <View style={styles.gradeHeader}>
                            <View style={styles.gradeTitleContainer}>
                              <Text style={styles.gradeTitle}>{subAssessment.sub_assessment_title}</Text>
                              <Text style={styles.gradeParent}>Part of: {subAssessment.parent_assessment_title}</Text>
                            </View>
                            {subAssessment.total_score !== null && (
                              <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(subAssessment.percentage_score) + '15' }]}>
                                <Text style={[styles.gradeBadgeText, { color: getGradeColor(subAssessment.percentage_score) }]}>
                                  {subAssessment.percentage_score >= 90 ? 'A' : 
                                   subAssessment.percentage_score >= 80 ? 'B' : 
                                   subAssessment.percentage_score >= 70 ? 'C' : 'D'}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          {subAssessment.total_score !== null ? (
                            <View style={styles.gradeDetails}>
                              <View style={styles.scoreRow}>
                                <Text style={styles.scoreLabel}>Score:</Text>
                                <Text style={styles.scoreValue}>
                                  {subAssessment.total_score}/{subAssessment.total_points}
                                </Text>
                              </View>
                              <View style={styles.percentageRow}>
                                <Text style={styles.percentageLabel}>Percentage:</Text>
                                <Text style={[styles.percentageValue, { color: getGradeColor(subAssessment.percentage_score) }]}>
                                  {subAssessment.percentage_score}%
                                </Text>
                              </View>
                              <View style={styles.progressBarContainer}>
                                <View style={styles.progressBar}>
                                  <View 
                                    style={[
                                      styles.progressFill, 
                                      { 
                                        width: `${Math.min(subAssessment.percentage_score, 100)}%`, 
                                        backgroundColor: getGradeColor(subAssessment.percentage_score) 
                                      }
                                    ]} 
                                  />
                                </View>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.noSubmissionContainer}>
                              <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                              <Text style={styles.noSubmissionText}>Not submitted</Text>
                            </View>
                          )}
                          
                          {subAssessment.remarks && (
                            <View style={styles.remarksContainer}>
                              <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                              <Text style={styles.remarksText}>{subAssessment.remarks}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assessment Grades</Text>
                    <View style={styles.emptyGradesContainer}>
                      <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyGradesText}>No assessments found for this student</Text>
                      <Text style={styles.emptyGradesSubtext}>Assessment grades will appear here once submitted</Text>
                    </View>
                  </View>
                )}

                {/* Analytics Cluster Section */}
                {studentData.analytics.cluster && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Analysis</Text>
                    <View style={styles.clusterCard}>
                      <Text style={styles.clusterLabel}>Cluster: {studentData.analytics.cluster.cluster_label}</Text>
                      <Text style={styles.clusterAlgorithm}>Algorithm: {studentData.analytics.cluster.algorithm_used}</Text>
                      <Text style={styles.clusterDate}>
                        Generated: {new Date(studentData.analytics.cluster.generated_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load student data</Text>
              </View>
            )}
          </View>
        )}
      </ModalContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  info: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 20,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  studentPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  studentId: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  tableViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  tableView: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    padding: 12,
    fontSize: 14,
    color: '#374151',
  },
  tableStudentPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  tableDefaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingBottom: 40,
  },
  modalStudentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalStudentPhotoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    overflow: 'hidden',
  },
  modalStudentPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalDefaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalStudentInfo: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalStudentId: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalStudentEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalStudentStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  dataContainer: {
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
  },
  attendanceStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  attendanceRecord: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attendanceRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  remarks: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  assessmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  assessmentType: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    color: '#374151',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noGradeText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  assessmentRemarks: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  clusterCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clusterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  clusterAlgorithm: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  clusterDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  // New improved grade styles
  gradesContainer: {
    gap: 12,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gradeTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gradeParent: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  gradeDetails: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSubmissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 8,
  },
  noSubmissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  remarksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  remarksText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    flex: 1,
  },
  emptyGradesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyGradesText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyGradesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
}); 