import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import apiClient from '../../../utils/api';
import FacultySyllabiCreationHeader from '../../components/FacultySyllabiCreationHeader';

export default function SyllabiCreationScreen() {
  const { currentUser } = useUser();
  const params = useLocalSearchParams();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showILOModal, setShowILOModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedILOs, setSelectedILOs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assessment_framework: {},
    grading_policy: {},
    course_outline: '',
    learning_resources: [],
    prerequisites: '',
    course_objectives: '',
    version: '1.0',
    is_template: false,
    template_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [availableILOs, setAvailableILOs] = useState([]);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [newILOs, setNewILOs] = useState([{ code: '', description: '', category: 'Knowledge', level: 'Basic', weight_percentage: 25 }]);
  const scrollViewRef = useRef(null);
  const inputRefs = useRef([]);

  // Only allow edit mode
  if (!params.syllabusId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 20, color: 'gray' }}>No syllabus selected for editing.</Text>
      </View>
    );
  }

  // Prefill logic for editing
  useEffect(() => {
    const { syllabusId } = params;
    if (syllabusId && currentUser) {
      setIsLoading(true);
      apiClient.get(`/syllabus/one/${syllabusId}`)
        .then(res => {
          console.log('Syllabus prefill API response:', res);
          const found = res;
          if (found) {
            const newFormData = {
              title: found.title || '',
              description: found.description || '',
              assessment_framework: found.assessment_framework || {},
              grading_policy: found.grading_policy || {},
              course_outline: found.course_outline || '',
              learning_resources: found.learning_resources || [],
              prerequisites: found.prerequisites || '',
              course_objectives: found.course_objectives || '',
              version: found.version || '1.0',
              is_template: found.is_template || false,
              template_name: found.template_name || ''
            };
            setFormData(newFormData);
            
            // Set ILOs from the syllabus
            if (Array.isArray(found.ilos)) {
              setSelectedILOs(found.ilos.map(ilo => ({
                ilo_id: ilo.ilo_id,
                code: ilo.code,
                description: ilo.description,
                category: ilo.category,
                level: ilo.level,
                weight_percentage: ilo.weight_percentage,
                assessment_methods: ilo.assessment_methods || [],
                learning_activities: ilo.learning_activities || []
              })));
            }
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching syllabus:', err);
          setIsLoading(false);
        });
    }
  }, [params.syllabusId, currentUser]);

  // Fetch available ILOs
  useEffect(() => {
    apiClient.get('/syllabus/ilos')
      .then(res => {
        setAvailableILOs(res);
      })
      .catch(err => {
        console.error('Error fetching ILOs:', err);
      });
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDraft = () => {
    // Implementation for saving draft
  };

  const handleCourseSelection = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(false);
  };

  const handleILOSelection = (ilo) => {
    const isSelected = selectedILOs.some(selected => selected.ilo_id === ilo.ilo_id);
    if (isSelected) {
      setSelectedILOs(prev => prev.filter(selected => selected.ilo_id !== ilo.ilo_id));
    } else {
      setSelectedILOs(prev => [...prev, ilo]);
    }
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a syllabus title');
      return;
    }

    if (selectedILOs.length === 0) {
      Alert.alert('Error', 'Please select at least one ILO');
      return;
    }

    setIsLoading(true);

    try {
      const { syllabusId } = params;
      
      // Update syllabus
      await apiClient.put(`/syllabus/update/${syllabusId}`, {
        title: formData.title,
        description: formData.description,
        assessment_framework: formData.assessment_framework,
        grading_policy: formData.grading_policy,
        course_outline: formData.course_outline,
        learning_resources: formData.learning_resources,
        prerequisites: formData.prerequisites,
        course_objectives: formData.course_objectives,
        version: formData.version,
        is_template: formData.is_template,
        template_name: formData.template_name
      });

      // Create/update ILOs for this syllabus
      for (const ilo of selectedILOs) {
        if (ilo.ilo_id) {
          // Update existing ILO
          await apiClient.put(`/syllabus/ilos/${ilo.ilo_id}`, {
            code: ilo.code,
            description: ilo.description,
            category: ilo.category,
            level: ilo.level,
            weight_percentage: ilo.weight_percentage,
            assessment_methods: ilo.assessment_methods,
            learning_activities: ilo.learning_activities
          });
        } else {
          // Create new ILO
          await apiClient.post('/syllabus/ilos', {
            syllabus_id: syllabusId,
            code: ilo.code,
            description: ilo.description,
            category: ilo.category,
            level: ilo.level,
            weight_percentage: ilo.weight_percentage,
            assessment_methods: ilo.assessment_methods,
            learning_activities: ilo.learning_activities
          });
        }
      }

      Alert.alert(
        'Success',
        'Syllabus updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error updating syllabus:', error);
      Alert.alert('Error', 'Failed to update syllabus. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleAddNewILO = () => {
    setNewILOs(prev => [...prev, { code: '', description: '', category: 'Knowledge', level: 'Basic', weight_percentage: 25 }]);
  };

  const handleRemoveNewILO = (idx) => {
    setNewILOs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleNewILOChange = (idx, field, value) => {
    setNewILOs(prev => prev.map((ilo, i) => i === idx ? { ...ilo, [field]: value } : ilo));
  };

  const handleSaveNewILOs = async () => {
    const { syllabusId } = params;
    
    try {
      for (const ilo of newILOs) {
        if (ilo.code && ilo.description) {
          await apiClient.post('/syllabus/ilos', {
            syllabus_id: syllabusId,
            code: ilo.code,
            description: ilo.description,
            category: ilo.category,
            level: ilo.level,
            weight_percentage: ilo.weight_percentage,
            assessment_methods: [],
            learning_activities: []
          });
        }
      }
      
      // Refresh ILOs
      const response = await apiClient.get(`/syllabus/one/${syllabusId}`);
      if (response.ilos) {
        setSelectedILOs(response.ilos);
      }
      
      setNewILOs([{ code: '', description: '', category: 'Knowledge', level: 'Basic', weight_percentage: 25 }]);
      setShowILOModal(false);
    } catch (error) {
      console.error('Error saving new ILOs:', error);
      Alert.alert('Error', 'Failed to save new ILOs');
    }
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
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.course_id}
                style={styles.courseItem}
                onPress={() => handleCourseSelection(course)}
              >
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseCode}>{course.course_code}</Text>
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
            <Text style={styles.modalTitle}>Add New ILOs</Text>
            <TouchableOpacity onPress={() => setShowILOModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {newILOs.map((ilo, idx) => (
              <View key={idx} style={styles.iloInputGroup}>
                <View style={styles.iloHeader}>
                  <Text style={styles.iloLabel}>ILO {idx + 1}</Text>
                  {newILOs.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveNewILO(idx)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="ILO Code (e.g., ILO1)"
                  value={ilo.code}
                  onChangeText={(value) => handleNewILOChange(idx, 'code', value)}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="ILO Description"
                  value={ilo.description}
                  onChangeText={(value) => handleNewILOChange(idx, 'description', value)}
                  multiline
                />
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Category</Text>
                    <Picker
                      selectedValue={ilo.category}
                      onValueChange={(value) => handleNewILOChange(idx, 'category', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Knowledge" value="Knowledge" />
                      <Picker.Item label="Skills" value="Skills" />
                      <Picker.Item label="Attitude" value="Attitude" />
                    </Picker>
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Level</Text>
                    <Picker
                      selectedValue={ilo.level}
                      onValueChange={(value) => handleNewILOChange(idx, 'level', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Basic" value="Basic" />
                      <Picker.Item label="Intermediate" value="Intermediate" />
                      <Picker.Item label="Advanced" value="Advanced" />
                    </Picker>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Weight Percentage"
                  value={String(ilo.weight_percentage)}
                  onChangeText={(value) => handleNewILOChange(idx, 'weight_percentage', parseFloat(value) || 0)}
                  keyboardType="numeric"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={handleAddNewILO}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Another ILO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewILOs}>
              <Text style={styles.saveButtonText}>Save ILOs</Text>
            </TouchableOpacity>
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
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.previewTitle}>{formData.title}</Text>
            <Text style={styles.previewDescription}>{formData.description}</Text>
            
            <Text style={styles.previewSectionTitle}>Intended Learning Outcomes</Text>
            {selectedILOs.map((ilo, idx) => (
              <View key={idx} style={styles.previewILO}>
                <Text style={styles.previewILOCode}>{ilo.code}</Text>
                <Text style={styles.previewILODescription}>{ilo.description}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNumber) => (
        <View key={stepNumber} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            stepNumber <= step ? styles.stepActive : styles.stepInactive
          ]}>
            <Text style={[
              styles.stepText,
              stepNumber <= step ? styles.stepTextActive : styles.stepTextInactive
            ]}>
              {stepNumber}
            </Text>
          </View>
          <Text style={styles.stepLabel}>
            {stepNumber === 1 ? 'Basic Info' : stepNumber === 2 ? 'ILOs' : 'Review'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <Text style={styles.label}>Syllabus Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter syllabus title"
        value={formData.title}
        onChangeText={(value) => handleInputChange('title', value)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter syllabus description"
        value={formData.description}
        onChangeText={(value) => handleInputChange('description', value)}
        multiline
      />

      <Text style={styles.label}>Course Outline</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter course outline"
        value={formData.course_outline}
        onChangeText={(value) => handleInputChange('course_outline', value)}
        multiline
      />

      <Text style={styles.label}>Prerequisites</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter prerequisites"
        value={formData.prerequisites}
        onChangeText={(value) => handleInputChange('prerequisites', value)}
      />

      <Text style={styles.label}>Course Objectives</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter course objectives"
        value={formData.course_objectives}
        onChangeText={(value) => handleInputChange('course_objectives', value)}
        multiline
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Version</Text>
          <TextInput
            style={styles.input}
            placeholder="1.0"
            value={formData.version}
            onChangeText={(value) => handleInputChange('version', value)}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Template name (optional)"
            value={formData.template_name}
            onChangeText={(value) => handleInputChange('template_name', value)}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Intended Learning Outcomes</Text>
      
      <View style={styles.iloSection}>
        <View style={styles.iloHeader}>
          <Text style={styles.iloSectionTitle}>Selected ILOs</Text>
          <TouchableOpacity style={styles.addILOButton} onPress={() => setShowILOModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addILOButtonText}>Add New ILO</Text>
          </TouchableOpacity>
        </View>
        
        {selectedILOs.map((ilo, idx) => (
          <View key={idx} style={styles.iloCard}>
            <View style={styles.iloCardHeader}>
              <Text style={styles.iloCode}>{ilo.code}</Text>
              <TouchableOpacity onPress={() => {
                setSelectedILOs(prev => prev.filter((_, i) => i !== idx));
              }}>
                <Ionicons name="close" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
            <Text style={styles.iloDescription}>{ilo.description}</Text>
            <View style={styles.iloMeta}>
              <Text style={styles.iloMetaText}>Category: {ilo.category}</Text>
              <Text style={styles.iloMetaText}>Level: {ilo.level}</Text>
              <Text style={styles.iloMetaText}>Weight: {ilo.weight_percentage}%</Text>
            </View>
          </View>
        ))}
        
        {selectedILOs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No ILOs selected</Text>
            <Text style={styles.emptyStateSubtext}>Add ILOs to define learning outcomes</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Syllabus Details</Text>
        <Text style={styles.reviewLabel}>Title:</Text>
        <Text style={styles.reviewValue}>{formData.title}</Text>
        
        <Text style={styles.reviewLabel}>Description:</Text>
        <Text style={styles.reviewValue}>{formData.description}</Text>
        
        <Text style={styles.reviewLabel}>Version:</Text>
        <Text style={styles.reviewValue}>{formData.version}</Text>
      </View>
      
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>Intended Learning Outcomes ({selectedILOs.length})</Text>
        {selectedILOs.map((ilo, idx) => (
          <View key={idx} style={styles.reviewILO}>
            <Text style={styles.reviewILOCode}>{ilo.code}</Text>
            <Text style={styles.reviewILODescription}>{ilo.description}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.submitButtonText}>Updating...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Update Syllabus</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStepNavigation = () => (
    <View style={styles.stepNavigation}>
      <TouchableOpacity style={styles.navButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={20} color="#007AFF" />
        <Text style={styles.navButtonText}>
          {step === 1 ? 'Back' : 'Previous'}
        </Text>
      </TouchableOpacity>
      
      {step < totalSteps && (
        <TouchableOpacity 
          style={styles.navButton} 
          onPress={() => setStep(step + 1)}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading syllabus...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FacultySyllabiCreationHeader />
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          
          {renderStepNavigation()}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding at the bottom for bottom navigation
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepActive: {
    backgroundColor: '#DC2626',
  },
  stepInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepTextInactive: {
    color: '#6B7280',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  stepContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 15,
  },
  label: {
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
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  previewButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 2,
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
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
  courseItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  iloInputGroup: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iloLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  iloSection: {
    marginBottom: 20,
  },
  iloSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
  },
  addILOButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addILOButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  iloCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iloCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  iloCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  iloDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  iloMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  iloMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  reviewSection: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#353A40',
    marginBottom: 10,
  },
  reviewILO: {
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
  },
  previewILO: {
    marginBottom: 8,
  },
  previewILOCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 2,
  },
  previewILODescription: {
    fontSize: 14,
    color: '#353A40',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
}); 