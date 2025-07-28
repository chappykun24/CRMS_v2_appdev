import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [studentData, setStudentData] = useState([]);
  const [assessmentStatus, setAssessmentStatus] = useState({});
  const [subAssessmentGradingProgress, setSubAssessmentGradingProgress] = useState({});
  const [subAssessmentData, setSubAssessmentData] = useState({
    title: '',
    description: '',
    type: 'Task',
    dueDate: '',
    instructions: ''
  });
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingSubAssessment, setEditingSubAssessment] = useState(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [assessmentData, setAssessmentData] = useState({
    title: '',
    description: '',
    type: 'Project',
    totalPoints: 100,
    weightPercentage: 25,
    dueDate: '',
    instructions: ''
  });


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

  // Fetch student data and update assessment statuses when assessments change
  useEffect(() => {
    if (assessments.length > 0 && selectedClass) {
      fetchStudentData(selectedClass.id).then(() => {
        updateAllAssessmentStatuses();
      });
    }
  }, [assessments, selectedClass]);

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
      const subAssessmentsList = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
      setSubAssessments(subAssessmentsList);
      
      // Fetch grading progress for each sub-assessment
      const progressData = {};
      for (const subAssessment of subAssessmentsList) {
        const progress = await getSubAssessmentGradingProgress(subAssessment.sub_assessment_id);
        progressData[subAssessment.sub_assessment_id] = progress;
      }
      setSubAssessmentGradingProgress(progressData);
    } catch (err) {
      console.error('Error fetching sub-assessments:', err);
      setSubAssessments([]);
      setSubAssessmentGradingProgress({});
    }
  };



  const handlePublishAssessment = async (assessmentId) => {
    try {
      await apiClient.put(`/assessments/${assessmentId}/publish`);
      Alert.alert('Success', 'Assessment published successfully!');
      
      // Refresh assessment statuses
      updateAllAssessmentStatuses();
    } catch (err) {
      console.error('Error publishing assessment:', err);
      Alert.alert('Error', 'Failed to publish assessment');
    }
  };

  const resetSubAssessmentModal = () => {
    setSubAssessmentData({
      title: '',
      description: '',
      type: 'Task',
      dueDate: '',
      instructions: ''
    });
    setShowSubAssessmentModal(false);
    setEditingSubAssessment(null);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const iso = selectedDate.toISOString();
      setSubAssessmentData(prev => ({ ...prev, dueDate: iso.slice(0, 10) }));
    }
  };

  // Enhanced date validation with minimum date check
  const validateDate = (dateString) => {
    if (!dateString) return true; // Optional field
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    return !isNaN(date.getTime()) && 
           dateString.match(/^\d{4}-\d{2}-\d{2}$/) && 
           date >= today;
  };

  // Enhanced date formatting with better user experience
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if date is today or tomorrow for better UX
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get minimum date for date picker (today)
  const getMinimumDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Clear selected date
  const clearDate = () => {
    if (showAssessmentModal) {
      setAssessmentData(prev => ({ ...prev, dueDate: '' }));
    } else {
      setSubAssessmentData(prev => ({ ...prev, dueDate: '' }));
    }
  };

  // Get date validation message
  const getDateValidationMessage = (dateString) => {
    if (!dateString) return '';
    if (!validateDate(dateString)) {
      return 'Date must be today or later';
    }
    return '';
  };

  const calculateSubAssessmentTotals = () => {
    const publishedCount = subAssessments.filter(sa => sa.is_published).length;
    const gradedCount = subAssessments.filter(sa => sa.is_graded).length;
    
    return { publishedCount, gradedCount };
  };

  const getSubAssessmentGradingProgress = async (subAssessmentId) => {
    try {
      const studentsWithGrades = await apiClient.get(`/sub-assessments/${subAssessmentId}/students-with-grades`);
      const totalStudents = studentsWithGrades.length;
      
      // Count students with actual grades (not null scores)
      const gradedStudents = studentsWithGrades.filter(student => 
        student.status === 'graded' && student.total_score !== null && student.total_score !== undefined
      ).length;
      
      // Count students with submissions but no grades yet
      const submittedButNotGraded = studentsWithGrades.filter(student => 
        student.status === 'submitted' || (student.status === 'graded' && (student.total_score === null || student.total_score === undefined))
      ).length;
      
      return {
        totalStudents,
        gradedStudents,
        submittedButNotGraded,
        progress: totalStudents > 0 ? (gradedStudents / totalStudents) * 100 : 0
      };
    } catch (error) {
      console.error('Error fetching grading progress:', error);
      return { totalStudents: 0, gradedStudents: 0, submittedButNotGraded: 0, progress: 0 };
    }
  };

  const handleCreateSubAssessment = async () => {
    // Validation
    if (!subAssessmentData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!subAssessmentData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!subAssessmentData.dueDate) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }

    // Enhanced date validation
    if (!validateDate(subAssessmentData.dueDate)) {
      Alert.alert('Error', 'Please select a valid due date (must be today or later)');
      return;
    }

    try {
      if (editingSubAssessment) {
        // Update existing sub-assessment
        await apiClient.put(`/sub-assessments/${editingSubAssessment.sub_assessment_id}`, {
          title: subAssessmentData.title,
          description: subAssessmentData.description,
          type: subAssessmentData.type,
          due_date: subAssessmentData.dueDate,
          instructions: subAssessmentData.instructions
        });
        Alert.alert('Success', 'Sub-assessment updated successfully');
      } else {
        // Create new sub-assessment
        await apiClient.post('/sub-assessments', {
          assessment_id: selectedAssessment.assessment_id,
          title: subAssessmentData.title,
          description: subAssessmentData.description,
          type: subAssessmentData.type,
          due_date: subAssessmentData.dueDate,
          instructions: subAssessmentData.instructions
        });
        Alert.alert('Success', 'Sub-assessment created successfully');
      }

      resetSubAssessmentModal();
      handleAssessmentSelect(selectedAssessment);
    } catch (error) {
      console.error('Error saving sub-assessment:', error);
      Alert.alert('Error', 'Failed to save sub-assessment');
    }
  };

  const handlePublishSubAssessment = async (subAssessmentId) => {
    try {
      await apiClient.put(`/sub-assessments/${subAssessmentId}/publish`);
      Alert.alert('Success', 'Sub-assessment published successfully!');
      
      // Refresh sub-assessments list and assessment statuses
      const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${selectedAssessment.assessment_id}`);
      const subAssessmentsList = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
      setSubAssessments(subAssessmentsList);
      
      // Refresh grading progress
      const progressData = {};
      for (const subAssessment of subAssessmentsList) {
        const progress = await getSubAssessmentGradingProgress(subAssessment.sub_assessment_id);
        progressData[subAssessment.sub_assessment_id] = progress;
      }
      setSubAssessmentGradingProgress(progressData);
      
      updateAllAssessmentStatuses();
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
              Alert.alert('Success', 'Sub-assessment deleted successfully');
              handleAssessmentSelect(selectedAssessment);
            } catch (error) {
              console.error('Error deleting sub-assessment:', error);
              Alert.alert('Error', 'Failed to delete sub-assessment');
            }
          }
        }
      ]
    );
  };

  const handleEditSubAssessment = (subAssessment) => {
    setEditingSubAssessment(subAssessment);
    setSubAssessmentData({
      title: subAssessment.title,
      description: subAssessment.description,
      type: subAssessment.type,
      dueDate: subAssessment.due_date || '',
      instructions: subAssessment.instructions || ''
    });
    setShowSubAssessmentModal(true);
  };

  const handleEditAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setAssessmentData({
      title: assessment.title,
      description: assessment.description || '',
      type: assessment.type,
      totalPoints: assessment.total_points,
      weightPercentage: assessment.weight_percentage,
      dueDate: assessment.due_date ? new Date(assessment.due_date).toISOString().slice(0, 10) : '',
      instructions: assessment.instructions || ''
    });
    setShowAssessmentModal(true);
  };

  const resetAssessmentModal = () => {
    setAssessmentData({
      title: '',
      description: '',
      type: 'Project',
      totalPoints: 100,
      weightPercentage: 25,
      dueDate: '',
      instructions: ''
    });
    setShowAssessmentModal(false);
    setEditingAssessment(null);
  };

  const handleCreateAssessment = async () => {
    // Validation
    if (!assessmentData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!assessmentData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!assessmentData.dueDate) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }

    try {
      if (editingAssessment) {
        // Update existing assessment
        await apiClient.put(`/assessments/${editingAssessment.assessment_id}`, {
          title: assessmentData.title,
          description: assessmentData.description,
          type: assessmentData.type,
          total_points: assessmentData.totalPoints,
          weight_percentage: assessmentData.weightPercentage,
          due_date: assessmentData.dueDate,
          instructions: assessmentData.instructions
        });
        Alert.alert('Success', 'Assessment updated successfully');
      } else {
        // Create new assessment
        await apiClient.post('/assessments', {
          syllabus_id: selectedClass.syllabusId,
          section_course_id: selectedClass.id,
          title: assessmentData.title,
          description: assessmentData.description,
          type: assessmentData.type,
          total_points: assessmentData.totalPoints,
          weight_percentage: assessmentData.weightPercentage,
          due_date: assessmentData.dueDate,
          instructions: assessmentData.instructions
        });
        Alert.alert('Success', 'Assessment created successfully');
      }

      resetAssessmentModal();
      // Refresh assessments list
      const assessmentsRes = await apiClient.get(`/assessments/section-course/${selectedClass.id}`);
      setAssessments(Array.isArray(assessmentsRes) ? assessmentsRes : []);
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment');
    }
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
      const response = await apiClient.get(`/assessments/${assessmentId}/analytics`);
      return response;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  };

  const fetchStudentData = async (sectionCourseId) => {
    try {
      const response = await apiClient.get(`/section-courses/${sectionCourseId}/students`);
      setStudentData(response);
      return response;
    } catch (error) {
      console.error('Error fetching student data:', error);
      return [];
    }
  };

  const calculateAssessmentStatus = async (assessment) => {
    if (!assessment || !selectedClass) return 'Unknown';
    
    try {
      console.log(`\n=== Calculating status for assessment: ${assessment.title} ===`);
      
      // Get all sub-assessments for this assessment
      const subAssessmentsRes = await apiClient.get(`/sub-assessments/assessment/${assessment.assessment_id}`);
      const subAssessments = Array.isArray(subAssessmentsRes) ? subAssessmentsRes : [];
      
      console.log(`Sub-assessments found: ${subAssessments.length}`);
      
      if (subAssessments.length === 0) {
        console.log('Status: No Tasks (no sub-assessments)');
        return 'No Tasks';
      }

      // Get student data if not already loaded
      let students = studentData;
      if (students.length === 0) {
        students = await fetchStudentData(selectedClass.id);
      }

      console.log(`Students found: ${students.length}`);

      if (students.length === 0) {
        console.log('Status: No Students');
        return 'No Students';
      }

      // Calculate overall assessment status based on sub-assessments
      let totalSubAssessments = 0;
      let publishedSubAssessments = 0;
      let gradedSubAssessments = 0;
      let totalStudentSubmissions = 0;
      let totalStudentGrades = 0;

      for (const subAssessment of subAssessments) {
        totalSubAssessments++;
        console.log(`\nSub-assessment: ${subAssessment.title} (Published: ${subAssessment.is_published})`);
        
        if (subAssessment.is_published) {
          publishedSubAssessments++;
          
          // Check student submissions and grades for this sub-assessment
          try {
            const studentsWithGrades = await apiClient.get(`/sub-assessments/${subAssessment.sub_assessment_id}/students-with-grades`);
            console.log(`Students with grades for ${subAssessment.title}:`, studentsWithGrades.length);
            
            for (const student of studentsWithGrades) {
              if (student.submission_id) {
                totalStudentSubmissions++;
                console.log(`  Student ${student.full_name}: submission_id=${student.submission_id}, total_score=${student.total_score}`);
                if (student.total_score !== null) {
                  totalStudentGrades++;
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching grades for sub-assessment ${subAssessment.sub_assessment_id}:`, error);
          }
        }
      }

      console.log(`\n=== Summary ===`);
      console.log(`Total sub-assessments: ${totalSubAssessments}`);
      console.log(`Published sub-assessments: ${publishedSubAssessments}`);
      console.log(`Total student submissions: ${totalStudentSubmissions}`);
      console.log(`Total student grades: ${totalStudentGrades}`);

      // Determine assessment status
      let status;
      if (publishedSubAssessments === 0) {
        status = 'Draft';
      } else if (totalStudentSubmissions === 0) {
        status = 'Published';
      } else if (totalStudentGrades === 0) {
        status = 'Submissions Received';
      } else if (totalStudentGrades === totalStudentSubmissions) {
        status = 'Fully Graded';
      } else {
        status = 'Partially Graded';
      }

      console.log(`Final status: ${status}`);
      return status;

    } catch (error) {
      console.error('Error calculating assessment status:', error);
      return 'Error';
    }
  };

  const updateAllAssessmentStatuses = async () => {
    const newStatuses = {};
    for (const assessment of assessments) {
      const status = await calculateAssessmentStatus(assessment);
      newStatuses[assessment.assessment_id] = status;
    }
    setAssessmentStatus(newStatuses);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'planned': return '#6B7280';
      case 'submissions_closed': return '#EF4444';
      case 'graded': return '#3B82F6';
      case 'No Tasks': return '#6B7280';
      case 'No Students': return '#6B7280';
      case 'Draft': return '#F59E0B';
      case 'Published': return '#10B981';
      case 'Submissions Received': return '#3B82F6';
      case 'Partially Graded': return '#F59E0B';
      case 'Fully Graded': return '#10B981';
      case 'Error': return '#EF4444';
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assessmentStatus[assessment.assessment_id] || assessment.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(assessmentStatus[assessment.assessment_id] || assessment.status) }]}>
            {assessmentStatus[assessment.assessment_id] || assessment.status}
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
          onPress={() => handleEditAssessment(assessment)}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderAssessmentDetails = () => (
    <View style={styles.assessmentDetailsContainer}>
      {/* Sub-Assessments Section */}
      <View style={styles.subAssessmentsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sub-Assessments</Text>
          <TouchableOpacity
            style={styles.addSubAssessmentButton}
            onPress={() => setShowSubAssessmentModal(true)}
          >
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text style={styles.addSubAssessmentButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>

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
                
                {subAssessment.description && (
                  <Text style={styles.subAssessmentDescription}>{subAssessment.description}</Text>
                )}
                
                <View style={styles.subAssessmentMeta}>
                  <View style={styles.subAssessmentMetaRow}>
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

                {/* Individual Grading Progress Bar */}
                {(() => {
                  const progress = subAssessmentGradingProgress[subAssessment.sub_assessment_id];
                  if (progress && progress.totalStudents > 0) {
                    const status = progress.progress === 0 ? 'Not Started' : 
                                  progress.progress === 100 ? 'Completed' : 
                                  progress.progress >= 50 ? 'Half Complete' : 'In Progress';
                    
                    return (
                      <View style={styles.subAssessmentProgressContainer}>
                        <View style={styles.subAssessmentProgressHeader}>
                          <Text style={styles.subAssessmentProgressLabel}>Student Grading:</Text>
                          <Text style={styles.subAssessmentProgressStatus}>{status}</Text>
                        </View>
                        <View style={styles.subAssessmentProgressBar}>
                          <View style={[styles.subAssessmentProgressFill, { width: `${progress.progress}%` }]} />
                        </View>
                        <Text style={styles.subAssessmentProgressText}>
                          {progress.progress.toFixed(0)}% Complete ({progress.gradedStudents}/{progress.totalStudents} students)
                        </Text>
                        {progress.submittedButNotGraded > 0 && (
                          <Text style={styles.subAssessmentProgressWarning}>
                            ⚠️ {progress.submittedButNotGraded} students submitted but not graded
                          </Text>
                        )}
                        {progress.totalStudents > 0 && progress.gradedStudents === 0 && (
                          <Text style={styles.subAssessmentProgressWarning}>
                            ⚠️ No students graded yet
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.viewGradingButton}
                          onPress={() => {
                            // Navigate to the existing grading system
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
                          <Ionicons name="create-outline" size={12} color="#DC2626" />
                          <Text style={styles.viewGradingButtonText}>View & Grade Students</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return null;
                })()}
                
                <View style={styles.subAssessmentActions}>
                  <TouchableOpacity
                    style={styles.subAssessmentActionButton}
                    onPress={() => handlePublishSubAssessment(subAssessment.sub_assessment_id)}
                  >
                    <Ionicons 
                      name={subAssessment.is_published ? "eye-off" : "eye"} 
                      size={12} 
                      color={subAssessment.is_published ? "#EF4444" : "#10B981"} 
                    />
                    <Text style={[
                      styles.subAssessmentActionText,
                      { color: subAssessment.is_published ? "#EF4444" : "#10B981" }
                    ]}>
                      {subAssessment.is_published ? "Unpublish" : "Publish"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.subAssessmentActionButton}
                    onPress={() => handleEditSubAssessment(subAssessment)}
                  >
                    <Ionicons name="create-outline" size={12} color="#3B82F6" />
                    <Text style={styles.subAssessmentActionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.subAssessmentActionButton}
                    onPress={() => handleDeleteSubAssessment(subAssessment.sub_assessment_id)}
                  >
                    <Ionicons name="trash-outline" size={12} color="#EF4444" />
                    <Text style={[styles.subAssessmentActionText, { color: "#EF4444" }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySubAssessments}>
            <Ionicons name="document-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptySubAssessmentsText}>No sub-assessments yet</Text>
            <Text style={styles.emptySubAssessmentsSubtext}>Create your first task to get started</Text>
          </View>
        )}
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
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assessments</Text>
                <TouchableOpacity
                  style={styles.addAssessmentButton}
                  onPress={() => setShowAssessmentModal(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addAssessmentButtonText}>Create Assessment</Text>
                </TouchableOpacity>
              </View>
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
        </ScrollView>
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
              <Text style={styles.modalTitle}>{editingSubAssessment ? 'Edit Sub-Assessment' : 'Create Sub-Assessment'}</Text>
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

              <Text style={styles.inputLabel}>Due Date</Text>
              <View style={styles.datePickerRow}>
                <TouchableOpacity 
                  style={[styles.pickerContainer, styles.datePickerContainer, subAssessmentData.dueDate && styles.pickerContainerSelected]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.pickerText, subAssessmentData.dueDate && styles.pickerTextSelected]}>
                    {subAssessmentData.dueDate ? formatDate(subAssessmentData.dueDate) : 'Select due date'}
                  </Text>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={subAssessmentData.dueDate ? "#DC2626" : "#6B7280"} 
                  />
                </TouchableOpacity>
                {subAssessmentData.dueDate && (
                  <TouchableOpacity 
                    style={styles.clearDateButton}
                    onPress={clearDate}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              {subAssessmentData.dueDate && (
                <Text style={styles.dateValidationText}>
                  {getDateValidationMessage(subAssessmentData.dueDate)}
                </Text>
              )}

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
                <Text style={styles.createAssessmentButtonText}>{editingSubAssessment ? 'Update Task' : 'Create Task'}</Text>
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
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {['Project', 'Quiz', 'Assignment', 'Exam', 'Lab', 'Presentation'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.typeOption}
                  onPress={() => {
                    if (showAssessmentModal) {
                      setAssessmentData(prev => ({ ...prev, type }));
                    } else {
                      setSubAssessmentData(prev => ({ ...prev, type }));
                    }
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={styles.typeOptionText}>{type}</Text>
                  {(showAssessmentModal ? assessmentData.type : subAssessmentData.type) === type && (
                    <Ionicons name="checkmark" size={20} color="#DC2626" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={getMinimumDate()}
          maximumDate={new Date(new Date().getFullYear() + 2, 11, 31)} // Allow dates up to 2 years from now
        />
      )}

      {/* Assessment Modal */}
      <Modal
        visible={showAssessmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetAssessmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAssessment ? 'Edit Assessment' : 'Create Assessment'}</Text>
              <TouchableOpacity onPress={resetAssessmentModal}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Assessment Details</Text>
                  
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={assessmentData.title}
                onChangeText={(text) => setAssessmentData(prev => ({ ...prev, title: text }))}
                placeholder="Enter assessment title"
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={assessmentData.description}
                onChangeText={(text) => setAssessmentData(prev => ({ ...prev, description: text }))}
                placeholder="Enter assessment description"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Type *</Text>
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={styles.pickerText}>{assessmentData.type}</Text>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Total Points</Text>
              <TextInput
                style={styles.textInput}
                value={assessmentData.totalPoints.toString()}
                onChangeText={(text) => setAssessmentData(prev => ({ ...prev, totalPoints: parseInt(text) || 0 }))}
                placeholder="Enter total points"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Weight Percentage</Text>
              <TextInput
                style={styles.textInput}
                value={assessmentData.weightPercentage.toString()}
                onChangeText={(text) => setAssessmentData(prev => ({ ...prev, weightPercentage: parseInt(text) || 0 }))}
                placeholder="Enter weight percentage"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Due Date</Text>
              <View style={styles.datePickerRow}>
                <TouchableOpacity 
                  style={[styles.pickerContainer, styles.datePickerContainer, assessmentData.dueDate && styles.pickerContainerSelected]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.pickerText, assessmentData.dueDate && styles.pickerTextSelected]}>
                    {assessmentData.dueDate ? formatDate(assessmentData.dueDate) : 'Select due date'}
                  </Text>
                  <Ionicons 
                    name="calendar-outline" 
                    size={20} 
                    color={assessmentData.dueDate ? "#DC2626" : "#6B7280"} 
                  />
                </TouchableOpacity>
                {assessmentData.dueDate && (
                  <TouchableOpacity 
                    style={styles.clearDateButton}
                    onPress={clearDate}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              {assessmentData.dueDate && (
                <Text style={styles.dateValidationText}>
                  {getDateValidationMessage(assessmentData.dueDate)}
                </Text>
              )}

              <Text style={styles.inputLabel}>Instructions</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={assessmentData.instructions}
                onChangeText={(text) => setAssessmentData(prev => ({ ...prev, instructions: text }))}
                placeholder="Enter instructions for students"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetAssessmentModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createAssessmentButton}
                onPress={handleCreateAssessment}
              >
                <Text style={styles.createAssessmentButtonText}>{editingAssessment ? 'Update Assessment' : 'Create Assessment'}</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Add padding to the bottom to prevent content from being hidden
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },

  classesContainer: {
    gap: 8,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    marginBottom: 8,
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
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  assessmentsContainer: {
    gap: 12,
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  selectedAssessmentCard: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  assessmentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assessmentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  assessmentDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  assessmentMeta: {
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  weightContainer: {
    marginTop: 4,
  },
  weightText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  assessmentActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#10B98120',
    gap: 4,
  },
  publishButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#3B82F620',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  assessmentDetailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  assessmentDetailsHeader: {
    marginBottom: 12,
  },
  assessmentDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  assessmentDetailsType: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  assessmentDetailsContent: {
    gap: 12,
  },
  assessmentDetailsDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  assessmentDetailsMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
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
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 14,
    color: '#1F2937',
  },
  pickerTextSelected: {
    color: '#DC2626',
    fontWeight: '500',
  },
  pickerContainerSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  datePickerContainer: {
    flex: 1,
  },
  clearDateButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dateValidationText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Sub-Assessments Styles
  subAssessmentsSection: {
    marginTop: 12,
  },
  addSubAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  addSubAssessmentButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  subAssessmentsList: {
    gap: 8,
  },
  subAssessmentCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subAssessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  subAssessmentInfo: {
    flex: 1,
  },
  subAssessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  subAssessmentType: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  subAssessmentDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 14,
  },
  subAssessmentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subAssessmentPoints: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626',
  },
  subAssessmentDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  subAssessmentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  subAssessmentInstructions: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  subAssessmentActions: {
    flexDirection: 'row',
    gap: 4,
  },
  publishSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#10B98120',
    gap: 2,
  },
  publishSubButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#10B981',
  },
  gradeSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#3B82F620',
    gap: 2,
  },
  gradeSubButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#3B82F6',
  },
  deleteSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EF444420',
    gap: 2,
  },
  deleteSubButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#EF4444',
  },
  emptySubAssessments: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptySubAssessmentsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 2,
  },
  emptySubAssessmentsSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  iloAlignmentSection: {
    marginBottom: 12,
  },
  iloAlignmentList: {
    gap: 6,
  },
  iloAlignmentItem: {
    padding: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  iloAlignmentCode: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 1,
  },
  iloAlignmentDescription: {
    fontSize: 10,
    color: '#6B7280',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedTypeOption: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  subAssessmentsProgress: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#353A40',
  },
  progressStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
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
  // Sub-Assessment Progress Styles
  subAssessmentProgressContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  subAssessmentProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subAssessmentProgressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#353A40',
  },
  subAssessmentProgressStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  subAssessmentProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  subAssessmentProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  subAssessmentProgressText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
  },
  subAssessmentProgressWarning: {
    fontSize: 10,
    color: '#EF4444',
    marginTop: 4,
    fontStyle: 'italic',
  },

  viewGradingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#DC262620',
    gap: 2,
    marginTop: 8,
  },
  viewGradingButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#DC2626',
  },
  subAssessmentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    gap: 2,
  },
  subAssessmentActionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
  addAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    gap: 4,
  },
  addAssessmentButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 