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
import { useUser } from '../contexts/UserContext';

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

  // Sample data - in real app, this would come from API
  const availableCourses = [
    {
      id: 1,
      courseCode: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      units: 3,
      specialization: 'Computer Science'
    },
    {
      id: 2,
      courseCode: 'MATH201',
      title: 'Calculus I',
      description: 'Introduction to differential calculus',
      units: 4,
      specialization: 'Mathematics'
    },
    {
      id: 3,
      courseCode: 'ENG101',
      title: 'English Composition',
      description: 'Basic composition and rhetoric',
      units: 3,
      specialization: 'English'
    }
  ];

  const availableILOs = [
    { id: 1, code: 'ILO1', description: 'Demonstrate understanding of fundamental programming concepts' },
    { id: 2, code: 'ILO2', description: 'Apply problem-solving techniques to computational problems' },
    { id: 3, code: 'ILO3', description: 'Write and debug simple computer programs' },
    { id: 4, code: 'ILO4', description: 'Analyze and evaluate program efficiency' },
    { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' },
    { id: 6, code: 'ILO6', description: 'Work collaboratively in team environments' }
  ];

  const schoolTerms = [
    { id: 1, schoolYear: '2024-2025', semester: '1st', isActive: true },
    { id: 2, schoolYear: '2024-2025', semester: '2nd', isActive: false },
    { id: 3, schoolYear: '2024-2025', semester: 'Summer', isActive: false }
  ];

  const handleSaveDraft = () => {
    Alert.alert(
      'Save Draft',
      'Syllabus draft saved successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleCourseSelection = (course) => {
    setSelectedCourse(course);
    setFormData({
      ...formData,
      courseCode: course.courseCode,
      courseTitle: course.title,
      courseDescription: course.description,
      units: course.units.toString(),
      specialization: course.specialization
    });
    setShowCourseModal(false);
  };

  const handleILOSelection = (ilo) => {
    const isSelected = selectedILOs.find(selected => selected.id === ilo.id);
    if (isSelected) {
      setSelectedILOs(selectedILOs.filter(selected => selected.id !== ilo.id));
    } else {
      setSelectedILOs([...selectedILOs, ilo]);
    }
  };

  const handlePreview = () => {
    if (!formData.title || !selectedCourse) {
      Alert.alert('Error', 'Please fill in the title and select a course');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !selectedCourse) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Submit Syllabus',
      'Are you sure you want to submit this syllabus for approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert(
              'Success',
              'Syllabus submitted successfully for approval!',
              [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]
            );
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
        { text: 'Discard', onPress: () => router.back() }
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
                style={styles.courseItem}
                onPress={() => handleCourseSelection(course)}
              >
                <View style={styles.courseItemHeader}>
                  <Text style={styles.courseCode}>{course.courseCode}</Text>
                  <Text style={styles.courseUnits}>{course.units} units</Text>
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription}>{course.description}</Text>
                <Text style={styles.courseSpecialization}>{course.specialization}</Text>
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
            <Text style={styles.modalTitle}>Select Intended Learning Outcomes</Text>
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
                  style={[styles.iloItem, isSelected && styles.iloItemSelected]}
                  onPress={() => handleILOSelection(ilo)}
                >
                  <View style={styles.iloItemHeader}>
                    <Text style={styles.iloCode}>{ilo.code}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.iloDescription}>{ilo.description}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowILOModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
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

          <ScrollView style={styles.previewContainer}>
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Course Information</Text>
              <Text style={styles.previewLabel}>Syllabus Title:</Text>
              <Text style={styles.previewValue}>{formData.title}</Text>
              
              <Text style={styles.previewLabel}>Course Code:</Text>
              <Text style={styles.previewValue}>{formData.courseCode}</Text>
              
              <Text style={styles.previewLabel}>Course Title:</Text>
              <Text style={styles.previewValue}>{formData.courseTitle}</Text>
              
              <Text style={styles.previewLabel}>Units:</Text>
              <Text style={styles.previewValue}>{formData.units}</Text>
              
              <Text style={styles.previewLabel}>Specialization:</Text>
              <Text style={styles.previewValue}>{formData.specialization}</Text>
            </View>

            {selectedILOs.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Intended Learning Outcomes</Text>
                {selectedILOs.map((ilo, index) => (
                  <View key={ilo.id} style={styles.previewILOItem}>
                    <Text style={styles.previewILOCode}>{ilo.code}</Text>
                    <Text style={styles.previewILODescription}>{ilo.description}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Course Details</Text>
              <Text style={styles.previewLabel}>Prerequisites:</Text>
              <Text style={styles.previewValue}>{formData.prerequisites}</Text>
              
              <Text style={styles.previewLabel}>Course Objectives:</Text>
              <Text style={styles.previewValue}>{formData.courseObjectives}</Text>
              
              <Text style={styles.previewLabel}>Learning Outcomes:</Text>
              <Text style={styles.previewValue}>{formData.learningOutcomes}</Text>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Teaching & Assessment</Text>
              <Text style={styles.previewLabel}>Course Content:</Text>
              <Text style={styles.previewValue}>{formData.courseContent}</Text>
              
              <Text style={styles.previewLabel}>Teaching Methods:</Text>
              <Text style={styles.previewValue}>{formData.teachingMethods}</Text>
              
              <Text style={styles.previewLabel}>Assessment Methods:</Text>
              <Text style={styles.previewValue}>{formData.assessmentMethods}</Text>
              
              <Text style={styles.previewLabel}>Grading System:</Text>
              <Text style={styles.previewValue}>{formData.gradingSystem}</Text>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Additional Information</Text>
              <Text style={styles.previewLabel}>References:</Text>
              <Text style={styles.previewValue}>{formData.references}</Text>
              
              <Text style={styles.previewLabel}>Schedule:</Text>
              <Text style={styles.previewValue}>{formData.schedule}</Text>
              
              <Text style={styles.previewLabel}>Office Hours:</Text>
              <Text style={styles.previewValue}>{formData.officeHours}</Text>
              
              <Text style={styles.previewLabel}>Contact Information:</Text>
              <Text style={styles.previewValue}>{formData.contactInfo}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#353A40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Syllabus</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSaveDraft}>
              <Ionicons name="save-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Course Selection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Selection</Text>
            
            <TouchableOpacity 
              style={styles.courseSelector} 
              onPress={() => setShowCourseModal(true)}
            >
              {selectedCourse ? (
                <View style={styles.selectedCourse}>
                  <View style={styles.selectedCourseHeader}>
                    <Text style={styles.selectedCourseCode}>{selectedCourse.courseCode}</Text>
                    <Text style={styles.selectedCourseUnits}>{selectedCourse.units} units</Text>
                  </View>
                  <Text style={styles.selectedCourseTitle}>{selectedCourse.title}</Text>
                  <Text style={styles.selectedCourseDescription}>{selectedCourse.description}</Text>
                </View>
              ) : (
                <View style={styles.courseSelectorPlaceholder}>
                  <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
                  <Text style={styles.courseSelectorText}>Select a Course</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iloSelector} 
              onPress={() => setShowILOModal(true)}
            >
              <View style={styles.iloSelectorHeader}>
                <Text style={styles.iloSelectorTitle}>Intended Learning Outcomes</Text>
                <Text style={styles.iloSelectorCount}>
                  {selectedILOs.length} selected
                </Text>
              </View>
              <Text style={styles.iloSelectorText}>
                {selectedILOs.length > 0 
                  ? selectedILOs.map(ilo => ilo.code).join(', ')
                  : 'Select ILOs for this course'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Syllabus Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Syllabus Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Syllabus Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="Enter syllabus title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prerequisites</Text>
              <TextInput
                style={styles.input}
                value={formData.prerequisites}
                onChangeText={(text) => setFormData({...formData, prerequisites: text})}
                placeholder="e.g., CS100 or equivalent"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Objectives</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.courseObjectives}
                onChangeText={(text) => setFormData({...formData, courseObjectives: text})}
                placeholder="List the main objectives of this course"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Learning Outcomes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.learningOutcomes}
                onChangeText={(text) => setFormData({...formData, learningOutcomes: text})}
                placeholder="What students will learn by the end of the course"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Course Content Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Content</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Course Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.courseContent}
                onChangeText={(text) => setFormData({...formData, courseContent: text})}
                placeholder="Outline the main topics and content covered in the course"
                multiline
                numberOfLines={6}
              />
            </View>
          </View>

          {/* Teaching & Assessment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Teaching & Assessment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teaching Methods</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.teachingMethods}
                onChangeText={(text) => setFormData({...formData, teachingMethods: text})}
                placeholder="e.g., Lectures, Laboratory work, Group discussions"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assessment Methods</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.assessmentMethods}
                onChangeText={(text) => setFormData({...formData, assessmentMethods: text})}
                placeholder="e.g., Quizzes, Midterm, Final Exam, Projects"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grading System</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.gradingSystem}
                onChangeText={(text) => setFormData({...formData, gradingSystem: text})}
                placeholder="Breakdown of grades and percentages"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>References</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.references}
                onChangeText={(text) => setFormData({...formData, references: text})}
                placeholder="Required and recommended readings"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Schedule</Text>
              <TextInput
                style={styles.input}
                value={formData.schedule}
                onChangeText={(text) => setFormData({...formData, schedule: text})}
                placeholder="e.g., MWF 9:00-10:30 AM"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Office Hours</Text>
              <TextInput
                style={styles.input}
                value={formData.officeHours}
                onChangeText={(text) => setFormData({...formData, officeHours: text})}
                placeholder="e.g., Tuesdays 2:00-4:00 PM"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Information</Text>
              <TextInput
                style={styles.input}
                value={formData.contactInfo}
                onChangeText={(text) => setFormData({...formData, contactInfo: text})}
                placeholder="Email, phone, or office location"
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
              <Text style={styles.submitButtonText}>Submit for Approval</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 16,
  },
  courseSelector: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  courseSelectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  courseSelectorText: {
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
  iloSelector: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
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
  modalFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  courseItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  courseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  courseUnits: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  courseSpecialization: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  iloItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iloItemSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  iloItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iloCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  iloDescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
  previewContainer: {
    flex: 1,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
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
  previewILOItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewILOCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  previewILODescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
}); 