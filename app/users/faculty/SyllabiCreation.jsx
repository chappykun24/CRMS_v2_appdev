import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import FacultySyllabiCreationHeader from '../../components/FacultySyllabiCreationHeader';

export default function SyllabiCreationScreen() {
  const { currentUser } = useUser();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showILOModal, setShowILOModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedILOs, setSelectedILOs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    courseTitle: '',
    courseDescription: '',
    units: '',
    prerequisites: '',
    courseObjectives: '',
    learningOutcomes: '',
    courseContent: '',
    teachingMethods: '',
    assessmentMethods: '',
    gradingSystem: '',
    references: '',
    schedule: '',
    officeHours: '',
    contactInfo: '',
    term: '',
    specialization: ''
  });

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample courses data
  const availableCourses = [
    {
      id: 'course-001',
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      units: '3',
      specialization: 'Computer Science',
      term: '2024-2025 1st Semester'
    },
    {
      id: 'course-002',
      code: 'MATH201',
      title: 'Calculus I',
      description: 'Introduction to differential calculus',
      units: '4',
      specialization: 'Mathematics',
      term: '2024-2025 1st Semester'
    },
    {
      id: 'course-003',
      code: 'ENG101',
      title: 'English Composition',
      description: 'Basic composition and rhetoric',
      units: '3',
      specialization: 'English',
      term: '2024-2025 1st Semester'
    }
  ];

  // Sample ILOs data
  const availableILOs = [
    { id: 1, code: 'ILO1', description: 'Demonstrate understanding of fundamental programming concepts' },
    { id: 2, code: 'ILO2', description: 'Apply problem-solving techniques to computational problems' },
    { id: 3, code: 'ILO3', description: 'Write and debug simple computer programs' },
    { id: 4, code: 'ILO4', description: 'Analyze and evaluate mathematical concepts' },
    { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' },
    { id: 6, code: 'ILO6', description: 'Work collaboratively in team environments' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your syllabus draft has been saved successfully!');
  };

  const handleCourseSelection = (course) => {
    setSelectedCourse(course);
    setFormData(prev => ({
      ...prev,
      courseCode: course.code,
      courseTitle: course.title,
      courseDescription: course.description,
      units: course.units,
      specialization: course.specialization,
      term: course.term
    }));
    setShowCourseModal(false);
  };

  const handleILOSelection = (ilo) => {
    const isSelected = selectedILOs.find(selected => selected.id === ilo.id);
    if (isSelected) {
      setSelectedILOs(prev => prev.filter(selected => selected.id !== ilo.id));
    } else {
      setSelectedILOs(prev => [...prev, ilo]);
    }
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleSubmit = () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course first.');
      return;
    }
    
    if (selectedILOs.length === 0) {
      Alert.alert('Error', 'Please select at least one Intended Learning Outcome.');
      return;
    }

    Alert.alert(
      'Submit Syllabus',
      'Are you sure you want to submit this syllabus for review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: () => {
            Alert.alert('Success', 'Syllabus submitted successfully!');
            router.back();
          }
        }
      ]
    );
  };

  const handleBack = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  const renderCourseModal = () => (
    <Modal
      visible={showCourseModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCourseModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Course</Text>
            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {availableCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseOption}
                onPress={() => handleCourseSelection(course)}
              >
                <View style={styles.courseOptionHeader}>
                  <Text style={styles.courseOptionCode}>{course.code}</Text>
                  <Text style={styles.courseOptionUnits}>{course.units} units</Text>
                </View>
                <Text style={styles.courseOptionTitle}>{course.title}</Text>
                <Text style={styles.courseOptionDescription}>{course.description}</Text>
                <Text style={styles.courseOptionSpecialization}>{course.specialization}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderILOModal = () => (
    <Modal
      visible={showILOModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowILOModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select ILOs</Text>
            <TouchableOpacity onPress={() => setShowILOModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {availableILOs.map((ilo) => {
              const isSelected = selectedILOs.find(selected => selected.id === ilo.id);
              return (
                <TouchableOpacity
                  key={ilo.id}
                  style={[styles.iloOption, isSelected && styles.iloOptionSelected]}
                  onPress={() => handleILOSelection(ilo)}
                >
                  <View style={styles.iloOptionHeader}>
                    <Text style={styles.iloOptionCode}>{ilo.code}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#DC2626" />
                    )}
                  </View>
                  <Text style={styles.iloOptionDescription}>{ilo.description}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderPreview = () => (
    <Modal
      visible={showPreviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Syllabus Preview</Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.previewContent}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Course Information</Text>
              <Text style={styles.previewLabel}>Course Code:</Text>
              <Text style={styles.previewValue}>{formData.courseCode}</Text>
              
              <Text style={styles.previewLabel}>Course Title:</Text>
              <Text style={styles.previewValue}>{formData.courseTitle}</Text>
              
              <Text style={styles.previewLabel}>Description:</Text>
              <Text style={styles.previewValue}>{formData.courseDescription}</Text>
            </View>
            
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Selected ILOs</Text>
              {selectedILOs.map((ilo) => (
                <View key={ilo.id} style={styles.previewILO}>
                  <Text style={styles.previewILOCode}>{ilo.code}</Text>
                  <Text style={styles.previewILODescription}>{ilo.description}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultySyllabiCreationHeader onSaveDraft={handleSaveDraft} />

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
          {/* Course Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Selection</Text>
            <Text style={styles.sectionSubtitle}>Choose the course for your syllabus</Text>
            
            <TouchableOpacity 
              style={styles.selectorCard} 
              onPress={() => setShowCourseModal(true)}
            >
              {selectedCourse ? (
                <View style={styles.selectedCourse}>
                  <View style={styles.selectedCourseHeader}>
                    <Text style={styles.selectedCourseCode}>{selectedCourse.code}</Text>
                    <Text style={styles.selectedCourseUnits}>{selectedCourse.units} units</Text>
                  </View>
                  <Text style={styles.selectedCourseTitle}>{selectedCourse.title}</Text>
                  <Text style={styles.selectedCourseDescription}>{selectedCourse.description}</Text>
                </View>
              ) : (
                <View style={styles.selectorPlaceholder}>
                  <Ionicons name="school-outline" size={24} color="#9CA3AF" />
                  <Text style={styles.selectorPlaceholderText}>Select a course</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ILO Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intended Learning Outcomes</Text>
            <Text style={styles.sectionSubtitle}>Select the ILOs for this course</Text>
            
            <TouchableOpacity 
              style={styles.selectorCard} 
              onPress={() => setShowILOModal(true)}
            >
              <View style={styles.iloSelectorHeader}>
                <Text style={styles.iloSelectorTitle}>Selected ILOs</Text>
                <Text style={styles.iloSelectorCount}>{selectedILOs.length} selected</Text>
              </View>
              {selectedILOs.length > 0 ? (
                <View style={styles.selectedILOs}>
                  {selectedILOs.map((ilo) => (
                    <View key={ilo.id} style={styles.selectedILO}>
                      <Text style={styles.selectedILOCode}>{ilo.code}</Text>
                      <Text style={styles.selectedILODescription}>{ilo.description}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.iloSelectorText}>No ILOs selected</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Syllabus Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Syllabus Details</Text>
            <Text style={styles.sectionSubtitle}>Fill in the course details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Objectives</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.courseObjectives}
                onChangeText={(value) => handleInputChange('courseObjectives', value)}
                placeholder="Enter course objectives..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Learning Outcomes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.learningOutcomes}
                onChangeText={(value) => handleInputChange('learningOutcomes', value)}
                placeholder="Enter learning outcomes..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.courseContent}
                onChangeText={(value) => handleInputChange('courseContent', value)}
                placeholder="Enter course content..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teaching Methods</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.teachingMethods}
                onChangeText={(value) => handleInputChange('teachingMethods', value)}
                placeholder="Enter teaching methods..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assessment Methods</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.assessmentMethods}
                onChangeText={(value) => handleInputChange('assessmentMethods', value)}
                placeholder="Enter assessment methods..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grading System</Text>
              <TextInput
                style={styles.input}
                value={formData.gradingSystem}
                onChangeText={(value) => handleInputChange('gradingSystem', value)}
                placeholder="e.g., A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: Below 60"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>References</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.references}
                onChangeText={(value) => handleInputChange('references', value)}
                placeholder="Enter course references..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Schedule</Text>
              <TextInput
                style={styles.input}
                value={formData.schedule}
                onChangeText={(value) => handleInputChange('schedule', value)}
                placeholder="e.g., MWF 9:00-10:30 AM"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Office Hours</Text>
              <TextInput
                style={styles.input}
                value={formData.officeHours}
                onChangeText={(value) => handleInputChange('officeHours', value)}
                placeholder="e.g., Tuesdays 2:00-4:00 PM"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Information</Text>
              <TextInput
                style={styles.input}
                value={formData.contactInfo}
                onChangeText={(value) => handleInputChange('contactInfo', value)}
                placeholder="e.g., Office: Room 301, Email: faculty@university.edu"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
              <Ionicons name="eye-outline" size={20} color="#DC2626" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Syllabus</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderCourseModal()}
      {renderILOModal()}
      {renderPreview()}
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
  scrollContentContainer: {
    paddingBottom: 100, // Add padding at the bottom for bottom navigation
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  selectorCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  selectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  selectorPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedCourse: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCourseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  selectedCourseUnits: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  selectedCourseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  selectedCourseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  iloSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iloSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  iloSelectorCount: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  iloSelectorText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  selectedILOs: {
    gap: 8,
  },
  selectedILO: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedILOCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  selectedILODescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  previewButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
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
  modalBody: {
    flex: 1,
  },
  courseOption: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseOptionCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  courseOptionUnits: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  courseOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  courseOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  courseOptionSpecialization: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  iloOption: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iloOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  iloOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  iloOptionCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  iloOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  previewContent: {
    flex: 1,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    color: '#353A40',
    marginBottom: 12,
    lineHeight: 22,
  },
  previewILO: {
    marginBottom: 8,
  },
  previewILOCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  previewILODescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
}); 