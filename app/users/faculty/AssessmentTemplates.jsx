import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import apiClient from '../../../utils/api';
import FacultyAssessmentTemplatesHeader from '../../components/FacultyAssessmentTemplatesHeader';

export default function AssessmentTemplatesScreen() {
  const { currentUser } = useUser();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    
    // Fetch templates and classes
    Promise.all([
      apiClient.get('/assessment-templates'),
      apiClient.get(`/syllabus/approved?facultyId=${currentUser.user_id}`)
    ]).then(([templatesRes, classesRes]) => {
      setTemplates(Array.isArray(templatesRes) ? templatesRes : []);
      setClasses(Array.isArray(classesRes) ? classesRes : []);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching templates:', err);
      setTemplates([]);
      setClasses([]);
      setLoading(false);
    });
  }, [currentUser]);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const handleBackNavigation = () => {
    router.push('/users/faculty/MyClasses');
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedClass) {
      Alert.alert('Error', 'Please select a class first');
      return;
    }

    try {
      const result = await apiClient.post('/assessments/from-template', {
        syllabusId: selectedClass.syllabus_id,
        sectionCourseId: selectedClass.section_course_id,
        templateId: selectedTemplate.template_id,
        facultyId: currentUser.user_id,
        startDate: new Date().toISOString().split('T')[0]
      });

      Alert.alert(
        'Success', 
        `Assessment template "${selectedTemplate.template_name}" applied to ${selectedClass.course_code}!`,
        [
          {
            text: 'View Assessments',
            onPress: () => {
              setShowTemplateModal(false);
              router.push({
                pathname: '/users/faculty/AssessmentManagement',
                params: { 
                  section_course_id: selectedClass.section_course_id,
                  syllabus_id: selectedClass.syllabus_id,
                  source: 'assessmentTemplates'
                }
              });
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error applying template:', error);
      Alert.alert('Error', 'Failed to apply assessment template');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.template_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTemplateCard = (template) => (
    <TouchableOpacity
      key={template.template_id}
      style={styles.templateCard}
      onPress={() => handleTemplateSelect(template)}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.template_name}</Text>
          <Text style={styles.templateType}>{template.template_type}</Text>
        </View>
        <View style={styles.templateBadge}>
          <Ionicons name="copy-outline" size={16} color="#DC2626" />
        </View>
      </View>

      <Text style={styles.templateDescription}>{template.description}</Text>

      {template.course_code && (
        <View style={styles.syllabusInfo}>
          <Text style={styles.courseCode}>{template.course_code}</Text>
          <Text style={styles.courseTitle}>{template.course_title}</Text>
        </View>
      )}

      <View style={styles.templateMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>Default Weight: {template.default_weight}%</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="list-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>
            {template.ilo_coverage ? template.ilo_coverage.length : 0} ILOs
          </Text>
        </View>
      </View>

      <View style={styles.templateActions}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => handleTemplateSelect(template)}
        >
          <Ionicons name="eye-outline" size={14} color="#3B82F6" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderTemplateDetails = () => {
    if (!selectedTemplate) return null;

    const assessmentStructure = selectedTemplate.assessment_structure;
    const rubricTemplate = selectedTemplate.rubric_template;

    return (
      <View style={styles.templateDetailsContainer}>
        <View style={styles.templateDetailsHeader}>
          <Text style={styles.templateDetailsTitle}>{selectedTemplate.template_name}</Text>
          <Text style={styles.templateDetailsType}>{selectedTemplate.template_type}</Text>
        </View>

        <Text style={styles.templateDetailsDescription}>{selectedTemplate.description}</Text>

        <View style={styles.templateDetailsSection}>
          <Text style={styles.sectionTitle}>Assessment Structure</Text>
          {assessmentStructure && assessmentStructure.assessment_structure && 
            assessmentStructure.assessment_structure.map((item, index) => (
              <View key={index} style={styles.assessmentItem}>
                <View style={styles.assessmentItemHeader}>
                  <Text style={styles.assessmentItemType}>{item.type}</Text>
                  <Text style={styles.assessmentItemCount}>{item.count} items</Text>
                </View>
                <View style={styles.assessmentItemMeta}>
                  <Text style={styles.assessmentItemWeight}>
                    {item.weight_per_assessment}% per item ({item.total_weight}% total)
                  </Text>
                  <Text style={styles.assessmentItemILOs}>
                    ILOs: {item.ilo_coverage ? item.ilo_coverage.join(', ') : 'N/A'}
                  </Text>
                </View>
              </View>
            ))
          }
        </View>

        <View style={styles.templateDetailsSection}>
          <Text style={styles.sectionTitle}>ILO Alignment</Text>
          <Text style={styles.iloAlignmentNote}>
            This template will create assessments that align with your syllabus ILOs. 
            You can customize the alignment when applying the template.
          </Text>
        </View>

        {rubricTemplate && (
          <View style={styles.templateDetailsSection}>
            <Text style={styles.sectionTitle}>Rubric Criteria</Text>
            {rubricTemplate.criteria && rubricTemplate.criteria.map((criterion, index) => (
              <View key={index} style={styles.rubricCriterion}>
                <Text style={styles.criterionName}>{criterion.name}</Text>
                <Text style={styles.criterionMaxScore}>Max Score: {criterion.max_score}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.templateDetailsSection}>
          <Text style={styles.sectionTitle}>Apply to Class</Text>
          <View style={styles.classSelector}>
            <Text style={styles.selectorLabel}>Select a class to apply this template:</Text>
            <ScrollView style={styles.classesList} horizontal showsHorizontalScrollIndicator={false}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.section_course_id}
                  style={[
                    styles.classOption,
                    selectedClass?.section_course_id === cls.section_course_id && styles.selectedClassOption
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={styles.classOptionCode}>{cls.course_code}</Text>
                  <Text style={styles.classOptionSection}>{cls.section_code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FacultyAssessmentTemplatesHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onBackNavigation={handleBackNavigation}
      />

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assessment Templates</Text>
            <Text style={styles.sectionSubtitle}>
              Choose from predefined assessment structures for your courses
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading templates...</Text>
            </View>
          ) : (
            <View style={styles.templatesContainer}>
              {filteredTemplates.map(renderTemplateCard)}
            </View>
          )}
        </View>
      </View>

      {/* Template Details Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Template Details</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {renderTemplateDetails()}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowTemplateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.applyButton,
                  !selectedClass && styles.applyButtonDisabled
                ]} 
                onPress={handleApplyTemplate}
                disabled={!selectedClass}
              >
                <Text style={styles.applyButtonText}>Apply Template</Text>
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  templatesContainer: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  templateType: {
    fontSize: 14,
    color: '#6B7280',
  },
  templateBadge: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  templateMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    gap: 4,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
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
  templateDetailsContainer: {
    gap: 20,
  },
  templateDetailsHeader: {
    marginBottom: 8,
  },
  templateDetailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  templateDetailsType: {
    fontSize: 14,
    color: '#6B7280',
  },
  templateDetailsDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  templateDetailsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  assessmentItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  assessmentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assessmentItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  assessmentItemCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  assessmentItemMeta: {
    gap: 2,
  },
  assessmentItemWeight: {
    fontSize: 12,
    color: '#6B7280',
  },
  assessmentItemILOs: {
    fontSize: 12,
    color: '#6B7280',
  },
  rubricCriterion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  criterionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
  },
  criterionMaxScore: {
    fontSize: 12,
    color: '#6B7280',
  },
  classSelector: {
    gap: 8,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
  },
  classesList: {
    flexDirection: 'row',
    gap: 8,
  },
  classOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minWidth: 80,
  },
  selectedClassOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  classOptionCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#353A40',
  },
  classOptionSection: {
    fontSize: 10,
    color: '#6B7280',
  },
  iloAlignmentNote: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  syllabusInfo: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  courseTitle: {
    fontSize: 11,
    color: '#6B7280',
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
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 