import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api';
import FacultyAssessmentManagementHeader from '../../components/FacultyAssessmentManagementHeader';

export default function AssessmentManagementScreen() {
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentView, setCurrentView] = useState('classes'); // 'classes', 'classDetails', 'assessmentDetails'
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [ilos, setIlos] = useState([]);

  const [subAssessments, setSubAssessments] = useState([]);
  const [showSubAssessmentModal, setShowSubAssessmentModal] = useState(false);
  const [subAssessmentData, setSubAssessmentData] = useState({
    title: '',
    description: '',
    type: 'Task',
    totalPoints: 10,
    weightPercentage: 10,
    dueDate: '',
    instructions: ''
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);



  useEffect(() => {
    const section_course_id = params.section_course_id;
    const syllabus_id = params.syllabus_id;
    if (!section_course_id || !syllabus_id) return;
    setLoading(true);
    
    // Fetch class info, assessments, and ILOs using working endpoints
    Promise.all([
      apiClient.get(`/syllabus/one/${syllabus_id}`),
      apiClient.get(`/assessments/syllabus/${syllabus_id}`),
      apiClient.get(`/ilos/syllabus/${syllabus_id}`)
    ]).then(([syllabusRes, assessmentsRes, ilosRes]) => {
      setClassData(syllabusRes);
      setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
      setIlos(Array.isArray(ilosRes) ? ilosRes : []);
      setSelectedClass({
        id: section_course_id,
        courseCode: syllabusRes.course_code || syllabusRes.course_title,
        courseTitle: syllabusRes.course_title || syllabusRes.title,
        schedule: syllabusRes.schedule || '',
        syllabusId: syllabus_id
      });
      setCurrentView('classDetails');
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching assessment data:', err);
      setClassData(null);
      setAssessments([]);
      setIlos([]);
      setSelectedClass(null);
      setLoading(false);
    });
  }, [params.section_course_id, params.syllabus_id]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const handleBackNavigation = () => {
    if (currentView === 'classes') {
      router.push('/users/faculty/MyClasses');
    } else if (currentView === 'classDetails') {
      router.push('/users/faculty/MyClasses');
    } else if (currentView === 'assessmentDetails') {
      setCurrentView('classDetails');
      setSelectedAssessment(null);
    } else if (currentView === 'createAssessment') {
      setCurrentView('classDetails');
      setShowCreateModal(false);
    }
  };

  const handleAssessmentSelect = async (assessment) => {
    setSelectedAssessment(assessment);
    setCurrentView('assessmentDetails');
    
    // Fetch sub-assessments for this assessment
    try {
      const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${assessment.assessment_id}`);
      setSubAssessments(Array.isArray(subAssessmentsRes) ? subAssessmentsRes : []);
    } catch (err) {
      console.error('Error fetching sub-assessments:', err);
      setSubAssessments([]);
    }
  };



  const handlePublishAssessment = async (assessmentId) => {
    try {
      await apiClient.put(`/assessments/${assessmentId}/publish`);
      Alert.alert('Success', 'Assessment published successfully!');
      
      // Refresh assessments list
      const assessmentsRes = await apiClient.get(`/assessments/syllabus/${selectedClass.syllabusId}`);
      setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
    } catch (error) {
      console.error('Error publishing assessment:', error);
      Alert.alert('Error', 'Failed to publish assessment');
    }
  };

  const resetSubAssessmentModal = () => {
    setSubAssessmentData({
      title: '',
      description: '',
      type: 'Task',
      totalPoints: 10,
      weightPercentage: 10,
      dueDate: '',
      instructions: ''
    });
    setShowSubAssessmentModal(false);
  };

  const validateDate = (dateString) => {
    if (!dateString) return true; // Optional field
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  };

  const calculateSubAssessmentTotals = () => {
    const totalPoints = subAssessments.reduce((sum, sa) => sum + (sa.total_points || 0), 0);
    const totalWeight = subAssessments.reduce((sum, sa) => sum + (sa.weight_percentage || 0), 0);
    const publishedCount = subAssessments.filter(sa => sa.is_published).length;
    const gradedCount = subAssessments.filter(sa => sa.is_graded).length;
    
    return { totalPoints, totalWeight, publishedCount, gradedCount };
  };

  const calculateAssessmentProgress = () => {
    if (subAssessments.length === 0) return { progress: 0, status: 'No sub-assessments' };
    
    const { publishedCount, gradedCount } = calculateSubAssessmentTotals();
    const progress = (gradedCount / subAssessments.length) * 100;
    
    let status = 'In Progress';
    if (progress === 0) status = 'Not Started';
    else if (progress === 100) status = 'Completed';
    else if (progress >= 50) status = 'Half Complete';
    
    return { progress, status };
  };

  const handleCreateSubAssessment = async () => {
    if (!selectedAssessment) return;
    
    // Validation
    if (!subAssessmentData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the sub-assessment');
      return;
    }
    
    if (subAssessmentData.totalPoints <= 0) {
      Alert.alert('Error', 'Total points must be greater than 0');
      return;
    }
    
    if (subAssessmentData.weightPercentage <= 0 || subAssessmentData.weightPercentage > 100) {
      Alert.alert('Error', 'Weight percentage must be between 1 and 100');
      return;
    }
    
    if (subAssessmentData.dueDate && !validateDate(subAssessmentData.dueDate)) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    try {
      const response = await apiClient.post('/sub-assessments', {
        assessment_id: selectedAssessment.assessment_id,
        title: subAssessmentData.title.trim(),
        description: subAssessmentData.description.trim(),
        type: subAssessmentData.type,
        total_points: subAssessmentData.totalPoints,
        weight_percentage: subAssessmentData.weightPercentage,
        due_date: subAssessmentData.dueDate ? new Date(subAssessmentData.dueDate).toISOString() : null,
        instructions: subAssessmentData.instructions.trim()
      });
      
      Alert.alert('Success', 'Sub-assessment created successfully!');
      setShowSubAssessmentModal(false);
      
      // Reset form
      setSubAssessmentData({
        title: '',
        description: '',
        type: 'Task',
        totalPoints: 10,
        weightPercentage: 10,
        dueDate: '',
        instructions: ''
      });
      
      // Refresh sub-assessments list
      const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${selectedAssessment.assessment_id}`);
      setSubAssessments(Array.isArray(subAssessmentsRes) ? subAssessmentsRes : []);
    } catch (err) {
      console.error('Error creating sub-assessment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create sub-assessment';
      Alert.alert('Error', errorMessage);
    }
  };

  const handlePublishSubAssessment = async (subAssessmentId) => {
    try {
      await apiClient.put(`/sub-assessments/${subAssessmentId}/publish`);
      Alert.alert('Success', 'Sub-assessment published successfully!');
      
      // Refresh sub-assessments list
      const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${selectedAssessment.assessment_id}`);
      setSubAssessments(Array.isArray(subAssessmentsRes) ? subAssessmentsRes : []);
    } catch (err) {
      console.error('Error publishing sub-assessment:', err);
      Alert.alert('Error', 'Failed to publish sub-assessment');
    }
  };

  const handleDeleteSubAssessment = async (subAssessmentId) => {
    Alert.alert(
      'Delete Sub-Assessment',
      'Are you sure you want to delete this sub-assessment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/sub-assessments/${subAssessmentId}`);
              Alert.alert('Success', 'Sub-assessment deleted successfully!');
              
              // Refresh sub-assessments list
              const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${selectedAssessment.assessment_id}`);
              setSubAssessments(Array.isArray(subAssessmentsRes) ? subAssessmentsRes : []);
            } catch (err) {
              console.error('Error deleting sub-assessment:', err);
              Alert.alert('Error', 'Failed to delete sub-assessment');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // New API functions for enhanced functionality
  const fetchSubAssessments = async (assessmentId) => {
    try {
      const response = await apiClient.get(`/sub-assessments/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub-assessments:', error);
      return [];
    }
  };

  const fetchILOs = async (syllabusId) => {
    try {
      const response = await apiClient.get(`/ilos/syllabus/${syllabusId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ILOs:', error);
      return [];
    }
  };

  const fetchRubrics = async (assessmentId) => {
    try {
      const response = await apiClient.get(`/rubrics/assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rubrics:', error);
      return [];
    }
  };

  const fetchAnalytics = async (assessmentId) => {
    try {
      const response = await apiClient.get(`/sub-assessments/${assessmentId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'planned': return '#6B7280';
      case 'submissions_closed': return '#EF4444';
      case 'graded': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderClassCard = (cls) => (
    <View key={cls.id} style={styles.classCard}>
      <View style={styles.cardHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseCode}>{cls.courseCode}</Text>
          <Text style={styles.courseTitle}>{cls.courseTitle}</Text>
          <Text style={styles.scheduleText}>{cls.schedule}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{assessments.length}</Text>
            <Text style={styles.statLabel}>Assessments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{ilos.length}</Text>
            <Text style={styles.statLabel}>Syllabus ILOs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{templates.length}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCreateAssessment('template')}
        >
          <Ionicons name="copy-outline" size={16} color="#475569" />
          <Text style={styles.actionButtonText}>From Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCreateAssessment('custom')}
        >
          <Ionicons name="add-circle-outline" size={16} color="#475569" />
          <Text style={styles.actionButtonText}>Custom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/users/faculty/GradeManagement',
            params: { 
              section_course_id: cls.id,
              syllabus_id: cls.syllabusId
            }
          })}
        >
          <Ionicons name="document-text-outline" size={16} color="#475569" />
          <Text style={styles.actionButtonText}>Grades</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAssessmentCard = (assessment) => (
    <TouchableOpacity
      key={assessment.assessment_id}
      style={[styles.assessmentCard, selectedAssessment?.assessment_id === assessment.assessment_id && styles.selectedAssessmentCard]}
      onPress={() => handleAssessmentSelect(assessment)}
    >
      <View style={styles.assessmentHeader}>
        <View style={styles.assessmentInfo}>
          <Text style={styles.assessmentTitle}>{assessment.title}</Text>
          <View style={styles.assessmentTypeContainer}>
            <Ionicons 
              name={assessment.type === 'Quiz' ? 'help-circle-outline' : 
                    assessment.type === 'Assignment' ? 'document-text-outline' : 
                    assessment.type === 'Project' ? 'folder-outline' : 'school-outline'} 
              size={16} 
              color="#6B7280" 
            />
          <Text style={styles.assessmentType}>{assessment.type}</Text>
        </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assessment.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(assessment.status) }]}>
            {assessment.status}
          </Text>
        </View>
      </View>
      
      {assessment.description && (
        <Text style={styles.assessmentDescription} numberOfLines={2}>
          {assessment.description}
        </Text>
      )}
      
      <View style={styles.assessmentMeta}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{formatDate(assessment.due_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{assessment.total_points} pts</Text>
          </View>
        </View>
        <View style={styles.weightContainer}>
          <Text style={styles.weightText}>{assessment.weight_percentage}% of total grade</Text>
        </View>
      </View>

      <View style={styles.assessmentActions}>
        {!assessment.is_published && (
          <TouchableOpacity
            style={styles.publishButton}
            onPress={() => handlePublishAssessment(assessment.assessment_id)}
          >
            <Ionicons name="eye-outline" size={16} color="#10B981" />
            <Text style={styles.publishButtonText}>Publish</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            Alert.alert('Edit Assessment', 'Assessment editing feature is coming soon!');
          }}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAssessmentDetails = () => (
    <View style={styles.assessmentDetailsContainer}>
      <View style={styles.assessmentDetailsHeader}>
        <Text style={styles.assessmentDetailsTitle}>{selectedAssessment.title}</Text>
        <Text style={styles.assessmentDetailsType}>{selectedAssessment.type}</Text>
      </View>
      
      <View style={styles.assessmentDetailsContent}>
        <Text style={styles.assessmentDetailsDescription}>{selectedAssessment.description}</Text>
        
        <View style={styles.assessmentDetailsMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Points:</Text>
            <Text style={styles.metaValue}>{selectedAssessment.total_points}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Weight:</Text>
            <Text style={styles.metaValue}>{selectedAssessment.weight_percentage}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date:</Text>
            <Text style={styles.metaValue}>{formatDate(selectedAssessment.due_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status:</Text>
            <Text style={[styles.metaValue, { color: getStatusColor(selectedAssessment.status) }]}>
              {selectedAssessment.status}
            </Text>
          </View>
        </View>

        {/* Assessment Progress */}
        {(() => {
          const { progress, status } = calculateAssessmentProgress();
          return (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Grading Progress:</Text>
                <Text style={styles.progressStatus}>{status}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress.toFixed(0)}% Complete</Text>
            </View>
          );
        })()}

        {selectedAssessment.ilo_codes && selectedAssessment.ilo_codes.length > 0 && (
          <View style={styles.iloAlignmentSection}>
            <Text style={styles.sectionTitle}>Aligned ILOs</Text>
            <View style={styles.iloAlignmentList}>
              {selectedAssessment.ilo_codes.map((iloCode, index) => {
                const ilo = ilos.find(i => i.code === iloCode);
                return ilo ? (
                  <View key={index} style={styles.iloAlignmentItem}>
                    <Text style={styles.iloAlignmentCode}>{ilo.code}</Text>
                    <Text style={styles.iloAlignmentDescription}>{ilo.description}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Sub-Assessments Section */}
        <View style={styles.subAssessmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sub-Assessments</Text>
            <TouchableOpacity
              style={styles.addSubAssessmentButton}
              onPress={() => setShowSubAssessmentModal(true)}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addSubAssessmentButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {/* Sub-Assessments Summary */}
          {subAssessments.length > 0 && (
            <View style={styles.subAssessmentsSummary}>
              {(() => {
                const { totalPoints, totalWeight, publishedCount, gradedCount } = calculateSubAssessmentTotals();
                return (
                  <>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Points:</Text>
                        <Text style={styles.summaryValue}>{totalPoints}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Weight:</Text>
                        <Text style={[styles.summaryValue, totalWeight > 100 ? { color: '#EF4444' } : {}]}>
                          {totalWeight}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Published:</Text>
                        <Text style={styles.summaryValue}>{publishedCount}/{subAssessments.length}</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Graded:</Text>
                        <Text style={styles.summaryValue}>{gradedCount}/{subAssessments.length}</Text>
                      </View>
                    </View>
                    {totalWeight > 100 && (
                      <Text style={styles.weightWarning}>
                        ⚠️ Total weight exceeds 100%. Please adjust sub-assessment weights.
                      </Text>
                    )}
                  </>
                );
              })()}
            </View>
          )}
          
          {subAssessments.length > 0 ? (
            <View style={styles.subAssessmentsList}>
              {subAssessments.map((subAssessment) => (
                <View key={subAssessment.sub_assessment_id} style={styles.subAssessmentCard}>
                  <View style={styles.subAssessmentHeader}>
                    <View style={styles.subAssessmentInfo}>
                      <Text style={styles.subAssessmentTitle}>{subAssessment.title}</Text>
                      <Text style={styles.subAssessmentType}>{subAssessment.type}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subAssessment.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(subAssessment.status) }]}>
                        {subAssessment.status}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.subAssessmentDescription}>{subAssessment.description}</Text>
                  
                  <View style={styles.subAssessmentMeta}>
                    <View style={styles.subAssessmentMetaRow}>
                      <Text style={styles.subAssessmentPoints}>
                        {subAssessment.total_points} pts ({subAssessment.weight_percentage}%)
                      </Text>
                      <Text style={styles.subAssessmentDate}>
                        Due: {formatDate(subAssessment.due_date)}
                      </Text>
                    </View>
                    {subAssessment.instructions && (
                      <Text style={styles.subAssessmentInstructions}>
                        Instructions: {subAssessment.instructions}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.subAssessmentActions}>
                    {!subAssessment.is_published && (
                      <TouchableOpacity
                        style={styles.publishSubButton}
                        onPress={() => handlePublishSubAssessment(subAssessment.sub_assessment_id)}
                      >
                        <Ionicons name="eye-outline" size={14} color="#10B981" />
                        <Text style={styles.publishSubButtonText}>Publish</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.gradeSubButton}
                      onPress={() => {
                        router.push({
                          pathname: '/users/faculty/SubAssessmentGradeManagement',
                          params: {
                            subAssessmentId: subAssessment.sub_assessment_id,
                            assessmentId: selectedAssessment.assessment_id,
                            sectionCourseId: selectedClass.id
                          }
                        });
                      }}
                    >
                      <Ionicons name="document-text-outline" size={14} color="#3B82F6" />
                      <Text style={styles.gradeSubButtonText}>Grade</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteSubButton}
                      onPress={() => handleDeleteSubAssessment(subAssessment.sub_assessment_id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={styles.deleteSubButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySubAssessments}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptySubAssessmentsText}>No sub-assessments yet</Text>
              <Text style={styles.emptySubAssessmentsSubtext}>
                Add tasks or components to this assessment
              </Text>
            </View>
          )}
        </View>

        <View style={styles.assessmentDetailsActions}>
          <TouchableOpacity
            style={styles.detailsActionButton}
            onPress={() => router.push({
              pathname: '/users/faculty/GradeManagement',
              params: { 
                section_course_id: selectedClass.id,
                syllabus_id: selectedClass.syllabusId,
                assessment_id: selectedAssessment.assessment_id
              }
            })}
          >
            <Ionicons name="document-text-outline" size={16} color="#475569" />
            <Text style={styles.detailsActionButtonText}>Grade Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsActionButton}
            onPress={() => {
              // For now, show an alert since RubricManagement page doesn't exist
              Alert.alert('Manage Rubrics', 'Rubric management feature is coming soon!');
            }}
          >
            <Ionicons name="list-outline" size={16} color="#475569" />
            <Text style={styles.detailsActionButtonText}>Manage Rubrics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultyAssessmentManagementHeader
        currentView={currentView}
        selectedClass={selectedClass}
        selectedAssessment={selectedAssessment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onBackNavigation={handleBackNavigation}
      />

      <View style={styles.content}>
        {currentView === 'classes' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            <View style={styles.classesContainer}>
              {selectedClass && renderClassCard(selectedClass)}
            </View>
          </View>
        )}

        {currentView === 'classDetails' && (
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assessments</Text>
            <View style={styles.assessmentsContainer}>
              {filteredAssessments.map(renderAssessmentCard)}
            </View>
          </View>
        )}

        {currentView === 'assessmentDetails' && (
          <View style={styles.section}>
            {renderAssessmentDetails()}
          </View>
        )}
      </View>



      {/* Create Sub-Assessment Modal */}
      <Modal
        visible={showSubAssessmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetSubAssessmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Sub-Assessment</Text>
              <TouchableOpacity onPress={resetSubAssessmentModal}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Task Details</Text>
                  
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                value={subAssessmentData.title}
                onChangeText={(text) => setSubAssessmentData(prev => ({ ...prev, title: text }))}
                placeholder="Enter task title"
                  />

                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                value={subAssessmentData.description}
                onChangeText={(text) => setSubAssessmentData(prev => ({ ...prev, description: text }))}
                placeholder="Enter task description"
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={styles.inputLabel}>Type *</Text>
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={styles.pickerText}>{subAssessmentData.type}</Text>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>

                  <Text style={styles.inputLabel}>Total Points *</Text>
                  <TextInput
                    style={styles.textInput}
                value={subAssessmentData.totalPoints.toString()}
                onChangeText={(text) => setSubAssessmentData(prev => ({ ...prev, totalPoints: parseInt(text) || 0 }))}
                placeholder="10"
                    keyboardType="numeric"
                  />

                  <Text style={styles.inputLabel}>Weight Percentage *</Text>
                  <TextInput
                    style={styles.textInput}
                value={subAssessmentData.weightPercentage.toString()}
                onChangeText={(text) => setSubAssessmentData(prev => ({ ...prev, weightPercentage: parseInt(text) || 0 }))}
                placeholder="10"
                    keyboardType="numeric"
                  />
              <Text style={styles.helpText}>
                Current total weight: {subAssessments.reduce((sum, sa) => sum + (sa.weight_percentage || 0), 0)}%
              </Text>

              <Text style={styles.inputLabel}>Due Date</Text>
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerText}>
                  {subAssessmentData.dueDate ? formatDate(subAssessmentData.dueDate) : 'Select due date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              </TouchableOpacity>

                  <Text style={styles.inputLabel}>Instructions</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                value={subAssessmentData.instructions}
                onChangeText={(text) => setSubAssessmentData(prev => ({ ...prev, instructions: text }))}
                placeholder="Enter task instructions"
                    multiline
                    numberOfLines={3}
                  />
            </ScrollView>

            <View style={styles.modalFooter}>
                    <TouchableOpacity
                style={styles.cancelButton} 
                onPress={resetSubAssessmentModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createAssessmentButton} 
                onPress={handleCreateSubAssessment}
              >
                <Text style={styles.createAssessmentButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {['Task', 'Quiz', 'Assignment', 'Project', 'Presentation', 'Lab', 'Exam', 'Other'].map((type) => (
                <TouchableOpacity
                  key={type}
                      style={[
                    styles.typeOption,
                    subAssessmentData.type === type && styles.selectedTypeOption
                      ]}
                      onPress={() => {
                    setSubAssessmentData(prev => ({ ...prev, type }));
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.typeOptionText,
                    subAssessmentData.type === type && styles.selectedTypeOptionText
                  ]}>
                    {type}
                  </Text>
                  {subAssessmentData.type === type && (
                    <Ionicons name="checkmark" size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Due Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Choose the due date for this sub-assessment</Text>
              
              {/* Quick Date Options */}
              <View style={styles.quickDateSection}>
                <Text style={styles.quickDateTitle}>Quick Options</Text>
                <View style={styles.quickDateGrid}>
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Tomorrow', days: 1 },
                    { label: 'Next Week', days: 7 },
                    { label: 'Next Month', days: 30 }
                  ].map((option) => {
                    const date = new Date();
                    date.setDate(date.getDate() + option.days);
                    const dateString = date.toISOString().split('T')[0];
                    
                    return (
                      <TouchableOpacity
                        key={option.label}
                        style={styles.quickDateOption}
                        onPress={() => {
                          setSubAssessmentData(prev => ({ ...prev, dueDate: dateString }));
                        }}
                      >
                        <Text style={styles.quickDateLabel}>{option.label}</Text>
                        <Text style={styles.quickDateValue}>{dateString}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Custom Date Selection */}
              <View style={styles.customDateSection}>
                <Text style={styles.customDateTitle}>Custom Date</Text>
                
                {/* Year Selection */}
                <View style={styles.dateInputRow}>
                  <Text style={styles.dateInputLabel}>Year:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={subAssessmentData.dueDate ? subAssessmentData.dueDate.split('-')[0] : ''}
                    onChangeText={(text) => {
                      const currentDate = subAssessmentData.dueDate ? subAssessmentData.dueDate.split('-') : ['', '', ''];
                      const newDate = `${text}-${currentDate[1] || ''}-${currentDate[2] || ''}`;
                      setSubAssessmentData(prev => ({ ...prev, dueDate: newDate }));
                    }}
                    placeholder="2024"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                {/* Month Selection */}
                <View style={styles.dateInputRow}>
                  <Text style={styles.dateInputLabel}>Month:</Text>
                  <View style={styles.monthPicker}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const monthStr = month.toString().padStart(2, '0');
                      const currentDate = subAssessmentData.dueDate ? subAssessmentData.dueDate.split('-') : ['', '', ''];
                      const isSelected = currentDate[1] === monthStr;
                      
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.monthOption,
                            isSelected && styles.selectedMonthOption
                          ]}
                          onPress={() => {
                            const newDate = `${currentDate[0] || ''}-${monthStr}-${currentDate[2] || ''}`;
                            setSubAssessmentData(prev => ({ ...prev, dueDate: newDate }));
                          }}
                        >
                          <Text style={[
                            styles.monthOptionText,
                            isSelected && styles.selectedMonthOptionText
                          ]}>
                            {monthStr}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Day Selection */}
                <View style={styles.dateInputRow}>
                  <Text style={styles.dateInputLabel}>Day:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={subAssessmentData.dueDate ? subAssessmentData.dueDate.split('-')[2] : ''}
                    onChangeText={(text) => {
                      const currentDate = subAssessmentData.dueDate ? subAssessmentData.dueDate.split('-') : ['', '', ''];
                      const newDate = `${currentDate[0] || ''}-${currentDate[1] || ''}-${text}`;
                      setSubAssessmentData(prev => ({ ...prev, dueDate: newDate }));
                    }}
                    placeholder="31"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>

              {/* Selected Date Display */}
              {subAssessmentData.dueDate && (
                <View style={styles.selectedDateDisplay}>
                  <Text style={styles.selectedDateLabel}>Selected Date:</Text>
                  <Text style={styles.selectedDateValue}>{subAssessmentData.dueDate}</Text>
                </View>
              )}

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                  onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createAssessmentButton} 
                  onPress={() => setShowDatePicker(false)}
              >
                  <Text style={styles.createAssessmentButtonText}>Set Date</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  classesContainer: {
    gap: 12,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  cardContent: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
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
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  assessmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedAssessmentCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    shadowOpacity: 0.1,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  assessmentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assessmentType: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  assessmentDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  assessmentMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  weightContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  weightText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  assessmentActions: {
    flexDirection: 'row',
    gap: 6,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  publishButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  assessmentDetailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assessmentDetailsHeader: {
    marginBottom: 16,
  },
  assessmentDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  assessmentDetailsType: {
    fontSize: 14,
    color: '#6B7280',
  },
  assessmentDetailsContent: {
    marginBottom: 16,
  },
  assessmentDetailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  assessmentDetailsMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
  },
  metaValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  assessmentDetailsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  detailsActionButtonText: {
    fontSize: 12,
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
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#353A40',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerText: {
    fontSize: 14,
    color: '#353A40',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  createAssessmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  createAssessmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Sub-Assessments Styles
  subAssessmentsSection: {
    marginTop: 24,
  },
  addSubAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  addSubAssessmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subAssessmentsList: {
    gap: 12,
  },
  subAssessmentCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subAssessmentInfo: {
    flex: 1,
  },
  subAssessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  subAssessmentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  subAssessmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  subAssessmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subAssessmentPoints: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  subAssessmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  subAssessmentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subAssessmentInstructions: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  subAssessmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  publishSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#10B98120',
    gap: 4,
  },
  publishSubButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  gradeSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#3B82F620',
    gap: 4,
  },
  gradeSubButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  deleteSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EF444420',
    gap: 4,
  },
  deleteSubButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
  },
  emptySubAssessments: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySubAssessmentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubAssessmentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  iloAlignmentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  iloAlignmentList: {
    gap: 8,
  },
  iloAlignmentItem: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  iloAlignmentCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  iloAlignmentDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedTypeOption: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#353A40',
    fontWeight: '500',
  },
  selectedTypeOptionText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  subAssessmentsSummary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  weightWarning: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  progressSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickDateSection: {
    marginBottom: 20,
  },
  quickDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  quickDateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickDateOption: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  quickDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  quickDateValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  customDateSection: {
    marginBottom: 20,
  },
  customDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    width: 60,
    marginRight: 12,
  },
  dateInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#353A40',
    backgroundColor: '#FFFFFF',
  },
  monthPicker: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  monthOption: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedMonthOption: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  monthOptionText: {
    fontSize: 12,
    color: '#353A40',
    fontWeight: '500',
  },
  selectedMonthOptionText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  selectedDateDisplay: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedDateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
}); 