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
    courseId: '',
    termId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  // Remove static availableILOs
  // Add state for availableILOs
  const [availableILOs, setAvailableILOs] = useState([]);
  // Add state for multi-step
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  // Add state for new ILOs
  const [newILOs, setNewILOs] = useState([{ code: '', description: '' }]);
  // Add ref for scrolling and focusing
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
              ...formData,
              title: found.title || found.syllabus_title || '',
              courseId: String(found.course_id || found.courseId || ''),
              termId: String(found.term_id || found.termId || ''),
              assessments: Array.isArray(found.assessments) ? found.assessments.map(a => ({
                id: a.id || a.assessment_id,
                title: a.title,
                type: a.type,
                date: a.date || a.created_at,
                weights: Array.isArray(a.weights) ? a.weights.map(w => ({
                  ilo_id: w.ilo_id,
                  ilo_code: w.ilo_code || w.code,
                  ilo_description: w.ilo_description || w.description,
                  weight_percentage: w.weight_percentage
                })) : [],
                rubrics: Array.isArray(a.rubrics) ? a.rubrics.map(r => ({
                  rubric_id: r.rubric_id,
                  title: r.title,
                  description: r.description,
                  criterion: r.criterion,
                  max_score: r.max_score,
                  ilo_id: r.ilo_id
                })) : []
              })) : [],
              section_course_id: found.section_course_id || ''
            };
            setFormData(newFormData);
            let ilosArr = [];
            if (Array.isArray(found.selectedILOs)) {
              ilosArr = found.selectedILOs.map(ilo => ({
                id: ilo.id || ilo.ilo_id,
                code: ilo.code || ilo.ilo_code,
                description: ilo.description || ilo.ilo_description
              }));
            } else if (Array.isArray(found.ilos)) {
              ilosArr = found.ilos.map(ilo => ({
                id: ilo.id || ilo.ilo_id,
                code: ilo.code || ilo.ilo_code,
                description: ilo.description || ilo.ilo_description
              }));
            }
            setSelectedILOs(ilosArr);
            let courseObj = null;
            if (found.course_id || found.courseId) {
              courseObj = {
                id: found.course_id || found.courseId,
                code: found.course_code || found.courseCode,
                title: found.course_title || found.courseTitle,
              };
            }
            setSelectedCourse(courseObj);
            // Debug logs
            console.log('Prefilled formData:', newFormData);
            console.log('Prefilled selectedILOs:', ilosArr);
            console.log('Prefilled selectedCourse:', courseObj);
          }
        })
        .catch(err => {
          console.error('Error fetching syllabus for edit:', err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [params.syllabusId, currentUser?.user_id]);

  // Fetch courses and terms on mount
  useEffect(() => {
    apiClient.get('/section-courses/courses')
      .then(res => {
        const courseArray = Array.isArray(res)
          ? res
          : (Array.isArray(res?.courses)
              ? res.courses
              : []);
        console.log('Fetched courses:', courseArray);
        setCourses(courseArray);
      })
      .catch(err => {
        console.error('API fetch error (courses):', err);
      });
    apiClient.get('/syllabus/terms')
      .then(res => {
        console.log('Fetched terms:', res);
        if (Array.isArray(res)) setTerms(res);
        else if (res && Array.isArray(res.terms)) setTerms(res.terms);
        else setTerms([]);
        console.log('Fetched terms:', res, 'Count:', Array.isArray(res) ? res.length : (res?.terms?.length || 0));
        if (Array.isArray(res) && res.length > 0) {
          console.log('Sample term:', res[0]);
        } else if (res?.terms && res.terms.length > 0) {
          console.log('Sample term:', res.terms[0]);
        }
      })
      .catch(err => {
        console.error('API fetch error (terms):', err);
      });
  }, []);

  // Fetch ILOs from backend on mount
  useEffect(() => {
    apiClient.get('/syllabus/ilos')
      .then(res => {
        console.log('Fetched ILOs:', res);
        if (Array.isArray(res)) setAvailableILOs(res);
        else setAvailableILOs([]);
        console.log('Fetched ILOs:', res, 'Count:', Array.isArray(res) ? res.length : 0);
        if (Array.isArray(res) && res.length > 0) {
          console.log('Sample ILO:', res[0]);
        }
      })
      .catch(err => {
        console.error('API fetch error (ILOs):', err);
      });
  }, []);

  // Add detailed log after prefill
  useEffect(() => {
    if (formData && selectedILOs && selectedCourse) {
      console.log('Prefilled formData:', formData);
      console.log('Prefilled selectedILOs:', selectedILOs);
      console.log('Prefilled selectedCourse:', selectedCourse);
    }
  }, [formData, selectedILOs, selectedCourse]);

  // Debug log for course selection
  useEffect(() => {
    console.log('Selected courseId:', formData.courseId);
  }, [formData.courseId]);
  // Debug log for term Picker options and value
  useEffect(() => {
    console.log('Available terms:', terms);
    console.log('Selected termId:', formData.termId);
  }, [terms, formData.termId]);
  // Debug log for ILO Picker options and value
  useEffect(() => {
    console.log('Available ILOs:', availableILOs);
    console.log('Selected ILOs:', selectedILOs);
  }, [availableILOs, selectedILOs]);
  // Debug log for rubric ILO Picker options and value in Step 3
  useEffect(() => {
    if (formData.assessments) {
      formData.assessments.forEach((a, idx) => {
        if (a.rubrics) {
          a.rubrics.forEach((r, ridx) => {
            console.log(`Assessment ${idx} Rubric ${ridx} ilo_id:`, r.ilo_id);
          });
        }
      });
    }
  }, [formData.assessments]);

  // Sync selectedILOs and formData.selectedILOs
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedILOs: selectedILOs
    }));
  }, [selectedILOs]);

  // Add a debug log for selected course
  useEffect(() => {
    console.log('DEBUG: Selected courseId:', formData.courseId);
    console.log('DEBUG: Selected course object:', selectedCourse);
  }, [formData.courseId, selectedCourse]);

  // Add a debug log on the last page (Step 3) to print formData.courseId and selectedCourse
  useEffect(() => {
    if (step === 3) {
      console.log('Step 3: courseId:', formData.courseId);
      console.log('Step 3: selectedCourse:', selectedCourse);
    }
  }, [step, formData.courseId, selectedCourse]);

  // Debug: Direct fetch for courses, terms, and ILOs
  useEffect(() => {
    // Replace direct fetch with apiClient
    apiClient.get('/section-courses/courses')
      .then(data => {
        console.log('Debug: apiClient courses:', data);
      })
      .catch(err => console.error('Debug: apiClient error (courses):', err));
    apiClient.get('/syllabus/terms')
      .then(data => {
        console.log('Debug: apiClient terms:', data);
      })
      .catch(err => console.error('Debug: apiClient error (terms):', err));
    apiClient.get('/syllabus/ilos')
      .then(data => {
        console.log('Debug: apiClient ILOs:', data);
      })
      .catch(err => console.error('Debug: apiClient error (ILOs):', err));
  }, []);

  if (!currentUser) {
    router.replace('/');
    return null;
  }
  if (isLoading) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></SafeAreaView>;
  }

  // Sample ILOs data
  // const availableILOs = [
  //   { id: 1, code: 'ILO1', description: 'Demonstrate understanding of fundamental programming concepts' },
  //   { id: 2, code: 'ILO2', description: 'Apply problem-solving techniques to computational problems' },
  //   { id: 3, code: 'ILO3', description: 'Write and debug simple computer programs' },
  //   { id: 4, code: 'ILO4', description: 'Analyze and evaluate mathematical concepts' },
  //   { id: 5, code: 'ILO5', description: 'Communicate technical concepts effectively' },
  //   { id: 6, code: 'ILO6', description: 'Work collaboratively in team environments' }
  // ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'courseId') {
      const courseObj = courses.find(c => String(c.course_id) === String(value));
      setSelectedCourse(courseObj || null);
    }
  };

  const handleSaveDraft = () => {
    Alert.alert('Draft Saved', 'Your syllabus draft has been saved successfully!');
  };

  const handleCourseSelection = (course) => {
    setSelectedCourse(course);
    setFormData(prev => ({
      ...prev,
      courseId: course.id,
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

  // In handleSubmit, send selected ILO IDs to backend
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
          onPress: async () => {
            try {
              const syllabusId = params.syllabusId || formData.syllabusId || formData.id;
              if (!syllabusId) {
                Alert.alert('Error', 'No syllabus ID found.');
                return;
              }
              // Clean assessments and rubrics before sending
              const cleanAssessments = (formData.assessments || []).map(a => {
                const base = {
                  ...(['id','title','type','iloIds','weights','rubrics'].reduce((acc, k) => (a[k] !== undefined ? { ...acc, [k]: a[k] } : acc), {})),
                  weights: Array.isArray(a.weights) ? a.weights.map(w => ({
                    ilo_id: w.ilo_id,
                    ilo_code: w.ilo_code,
                    ilo_description: w.ilo_description,
                    weight_percentage: Number(w.weight_percentage)
                  })) : [],
                  rubrics: Array.isArray(a.rubrics) ? a.rubrics.map(r => ({
                    ...(r.rubric_id ? { rubric_id: r.rubric_id } : {}),
                    title: r.title,
                    description: r.description,
                    criterion: r.criterion,
                    max_score: Number(r.max_score),
                    ilo_id: r.ilo_id
                  })) : []
                };
                if (formData.section_course_id && !isNaN(Number(formData.section_course_id))) {
                  base.section_course_id = Number(formData.section_course_id);
                }
                return base;
              });
              const payload = {
                title: formData.title,
                section_course_id: formData.section_course_id ? Number(formData.section_course_id) : undefined,
                assessments: cleanAssessments,
                // Add other fields as needed
              };
              console.log('Submitting syllabus payload:', JSON.stringify(payload, null, 2));
              await apiClient.put(`/syllabus/update/${syllabusId}`, payload);
            Alert.alert('Success', 'Syllabus submitted successfully!');
            router.back();
            } catch (err) {
              console.log('Submit error:', err, err?.response?.data);
              Alert.alert('Error', 'Failed to submit syllabus.');
            }
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

  const handleAddNewILO = () => {
    // Prevent adding if last ILO is empty
    const last = newILOs[newILOs.length - 1];
    if (!last.code.trim() || !last.description.trim()) {
      Alert.alert('Please fill in the code and description before adding another ILO.');
      return;
    }
    setNewILOs(prev => [...prev, { code: '', description: '' }]);
    setTimeout(() => {
      if (inputRefs.current[newILOs.length]) {
        inputRefs.current[newILOs.length].focus();
      }
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 200);
  };
  const handleRemoveNewILO = (idx) => {
    setNewILOs(prev => prev.filter((_, i) => i !== idx));
  };
  const handleNewILOChange = (idx, field, value) => {
    setNewILOs(prev => prev.map((ilo, i) => i === idx ? { ...ilo, [field]: value } : ilo));
  };
  const handleSaveNewILOs = async () => {
    // Validate all ILOs before saving
    for (const ilo of newILOs) {
      if (!ilo.code.trim() || !ilo.description.trim()) {
        Alert.alert('Please fill in all code and description fields before saving.');
        return;
      }
    }
    try {
      for (const ilo of newILOs) {
        await apiClient.post('/syllabus/ilos', ilo);
      }
      // Refetch ILOs after insert
      const res = await apiClient.get('/syllabus/ilos');
      setAvailableILOs(Array.isArray(res) ? res : []);
      setNewILOs([{ code: '', description: '' }]);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      Alert.alert('Success', 'ILOs added!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add ILOs.');
    }
  };

  // Add a handler for changing selected ILOs for an assessment
  const handleAssessmentILOChange = (assessmentIdx, selectedIds) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, idx) =>
        idx === assessmentIdx ? { ...a, iloIds: selectedIds } : a
      )
    }));
  };

  // Add a handler for changing weight for an ILO in an assessment
  const handleAssessmentWeightChange = (assessmentIdx, iloId, newWeight) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, idx) => {
        if (idx !== assessmentIdx) return a;
        // Update or add the weight for this ILO
        let weights = Array.isArray(a.weights) ? [...a.weights] : [];
        const wIdx = weights.findIndex(w => w.ilo_id === iloId);
        if (wIdx >= 0) {
          weights[wIdx] = { ...weights[wIdx], weight_percentage: newWeight };
        } else {
          const ilo = availableILOs.find(i => i.id === iloId);
          weights.push({ ilo_id: iloId, ilo_code: ilo?.code || '', ilo_description: ilo?.description || '', weight_percentage: newWeight });
        }
        return { ...a, weights, date: new Date().toISOString() };
      })
    }));
  };

  // Add a handler for editing rubric fields
  const handleRubricFieldChange = (assessmentIdx, rubricIdx, field, value) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, aIdx) => {
        if (aIdx !== assessmentIdx) return a;
        const rubrics = Array.isArray(a.rubrics) ? a.rubrics.map((r, rIdx) =>
          rIdx === rubricIdx ? { ...r, [field]: value } : r
        ) : [];
        return { ...a, rubrics };
      })
    }));
  };

  // Update handleInputChange for assessment fields to also update the date
  const handleAssessmentFieldChange = (assessmentIdx, field, value) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, idx) =>
        idx === assessmentIdx
          ? { ...a, [field]: value, date: new Date().toISOString() }
          : a
      )
    }));
  };

  // Add handler for adding/removing assessments
  const handleAddAssessment = () => {
    setFormData(prev => {
      const base = {
        title: '',
        type: '',
        iloIds: Array.isArray(selectedILOs) ? selectedILOs.map(ilo => ilo.id) : [],
        weights: [],
        rubrics: []
      };
      if (prev.section_course_id && !isNaN(Number(prev.section_course_id))) {
        base.section_course_id = Number(prev.section_course_id);
      }
      return {
        ...prev,
        assessments: [
          ...(Array.isArray(prev.assessments) ? prev.assessments : []),
          base
        ]
      };
    });
  };
  const handleRemoveAssessment = (idx) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.filter((_, i) => i !== idx)
    }));
  };

  // Add handler for adding/removing rubrics
  const handleAddRubric = (assessmentIdx) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, idx) =>
        idx === assessmentIdx
          ? {
              ...a,
              rubrics: [
                ...(Array.isArray(a.rubrics) ? a.rubrics : []),
                { title: '', description: '', criterion: '', max_score: '', ilo_id: (Array.isArray(formData.selectedILOs) && formData.selectedILOs[0]?.id) || '', assessment_id: a.id || undefined }
              ]
            }
          : a
      )
    }));
  };
  const handleRemoveRubric = (assessmentIdx, rubricIdx) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, idx) =>
        idx === assessmentIdx
          ? {
              ...a,
              rubrics: a.rubrics.filter((_, rIdx) => rIdx !== rubricIdx)
            }
          : a
      )
    }));
  };

  // Add handler for changing rubric ILO
  const handleRubricILOChange = (assessmentIdx, rubricIdx, iloId) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments.map((a, aIdx) => {
        if (aIdx !== assessmentIdx) return a;
        const rubrics = Array.isArray(a.rubrics) ? a.rubrics.map((r, rIdx) =>
          rIdx === rubricIdx ? { ...r, ilo_id: iloId } : r
        ) : [];
        return { ...a, rubrics };
      })
    }));
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
            {courses.map((course) => (
              <TouchableOpacity
                key={course.course_id}
                style={styles.courseOption}
                onPress={() => handleCourseSelection(course)}
              >
                <View style={styles.courseOptionHeader}>
                  <Text style={styles.courseOptionCode}>{course.course_code}</Text>
                  <Text style={styles.courseOptionUnits}>{course.title}</Text>
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
              <Text style={styles.previewValue}>{selectedCourse?.code}</Text>
              
              <Text style={styles.previewLabel}>Course Title:</Text>
              <Text style={styles.previewValue}>{selectedCourse?.title}</Text>
              
              <Text style={styles.previewLabel}>Description:</Text>
              <Text style={styles.previewValue}>{selectedCourse?.description}</Text>
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

  // Step indicator
  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 18 }}>
      {[1, 2, 3].map(s => (
        <View key={s} style={{ width: 32, height: 8, borderRadius: 4, marginHorizontal: 6, backgroundColor: step === s ? '#DC2626' : '#E5E7EB' }} />
      ))}
    </View>
  );

  // Shared styles for modal consistency
  const modalContainerStyle = { borderRadius: 12, padding: 18, marginBottom: 24, borderWidth: 0 };
  const sectionHeaderStyle = { fontWeight: 'bold', fontSize: 17, color: '#DC2626', marginBottom: 12 };
  const cardStyle = { backgroundColor: '#fff', borderRadius: 8, borderWidth: 0, padding: 14, marginBottom: 14 };

  // Step 1: Syllabus Info & ILOs
  // In renderStep1, guard term Picker and ILO section by course selection
  const renderStep1 = () => {
    console.log('Rendering courses dropdown:', courses);
    return (
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        <View style={modalContainerStyle}>
          <Text style={sectionHeaderStyle}>Course & Term</Text>
          <View style={{ ...styles.inputGroup, marginBottom: 18 }}>
            <Text style={styles.inputLabel}>Course</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, paddingHorizontal: 8, paddingVertical: 8, minHeight: 48 }}>
              <Picker
                selectedValue={formData.courseId}
                onValueChange={value => handleInputChange('courseId', value)}
                style={{ height: 48, fontSize: 16 }}
              >
                <Picker.Item label="Select a course" value="" />
                {Array.isArray(courses) && courses.map(course => (
                  <Picker.Item
                    key={course.course_id}
                    label={`${course.course_code} - ${course.title}${course.description ? ' | ' + course.description : ''}`}
                    value={String(course.course_id)}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={{ ...styles.inputGroup, marginBottom: 24 }}>
            <Text style={styles.inputLabel}>Term</Text>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, paddingHorizontal: 8, paddingVertical: 8, minHeight: 48 }}>
              <Picker
                selectedValue={formData.termId}
                onValueChange={value => handleInputChange('termId', value)}
                style={{ height: 48, fontSize: 16 }}
              >
                <Picker.Item label="Select a term" value="" />
                {Array.isArray(terms) && terms.map(term => (
                  <Picker.Item
                    key={term.term_id}
                    label={`${term.school_year} ${term.semester}`}
                    value={String(term.term_id)}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <Text style={sectionHeaderStyle}>Syllabus Title</Text>
          <View style={{ ...styles.inputGroup, marginBottom: 24 }}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={{ ...styles.input, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 }}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="Enter syllabus title"
            />
          </View>
          <Text style={sectionHeaderStyle}>Intended Learning Outcomes (ILOs)</Text>
          <View style={{ marginBottom: 8 }}>
            {availableILOs.map(ilo => {
              const selected = selectedILOs.some(sel => sel.id === ilo.id);
              return (
                <TouchableOpacity 
                  key={ilo.id}
                  style={{
                    ...cardStyle,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderColor: selected ? '#DC2626' : '#E5E7EB',
                    backgroundColor: selected ? '#FFF1F2' : '#fff',
                    borderRadius: 8,
                    marginBottom: 14,
                  }}
                  onPress={() => handleILOSelection(ilo)}
                  activeOpacity={0.88}
                >
                  {/* Checkbox (left) */}
                  <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#DC2626', backgroundColor: selected ? '#DC2626' : '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                    {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  {/* ILO code and description */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#DC2626', fontSize: 16, marginBottom: 4 }}>{ilo.code}</Text>
                    <Text style={{ color: '#475569', fontSize: 15, lineHeight: 20 }}>{ilo.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* ILO insertion form visually consistent with other cards */}
          <View style={{ ...cardStyle, backgroundColor: '#F3F4F6', borderRadius: 8, marginTop: 14 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#DC2626', marginBottom: 10 }}>Add Intended Learning Outcomes (ILOs)</Text>
            {newILOs.map((ilo, idx) => (
              <View key={idx} style={{ marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10 }}>
                <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14 }}>Code</Text>
                <TextInput
                  ref={ref => inputRefs.current[idx] = ref}
                  style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginBottom: 6, fontSize: 14 }}
                  value={ilo.code}
                  onChangeText={v => handleNewILOChange(idx, 'code', v)}
                  placeholder="ILO Code"
                  returnKeyType="next"
                />
                <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14 }}>Description</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, fontSize: 14, minHeight: 40, textAlignVertical: 'top' }}
                  value={ilo.description}
                  onChangeText={v => handleNewILOChange(idx, 'description', v)}
                  placeholder="ILO Description"
                  multiline
                />
                {newILOs.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveNewILO(idx)} style={{ marginTop: 4, alignSelf: 'flex-end' }}>
                    <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={handleAddNewILO} style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
              <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>+ Add Another ILO</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveNewILOs} style={{ backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'flex-end' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save ILOs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Step 2: Assessments (read-only for now)
  const renderStep2 = () => (
    <View style={modalContainerStyle}>
      <Text style={sectionHeaderStyle}>Assessments</Text>
      {Array.isArray(formData.assessments) && formData.assessments.length > 0 ? (
        formData.assessments.map((a, idx) => {
          // Use only selected ILOs from page 1
          const selectedILOOptions = Array.isArray(selectedILOs) ? selectedILOs : [];
          const selectedILOIds = Array.isArray(a.iloIds)
            ? a.iloIds
            : (Array.isArray(a.weights) ? a.weights.map(w => w.ilo_id) : []);
          // Multi-select dropdown UI
          return (
            <View key={a.id || idx} style={cardStyle}>
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14, marginBottom: 2 }}>Linked ILO(s):</Text>
                {selectedILOOptions.length > 0 ? (
                  <TouchableOpacity
                    style={{ backgroundColor: '#F3F4F6', borderRadius: 6, padding: 8, minHeight: 36, borderWidth: 1, borderColor: '#E5E7EB' }}
                    onPress={() => setFormData(prev => ({
                      ...prev,
                      assessments: prev.assessments.map((assess, i) =>
                        i === idx ? { ...assess, showILOSelect: !assess.showILOSelect } : { ...assess, showILOSelect: false }
                      )
                    }))}
                  >
                    <Text style={{ color: selectedILOIds.length ? '#DC2626' : '#64748B', fontWeight: 'bold', fontSize: 14 }}>
                      {selectedILOIds.length
                        ? selectedILOOptions.filter(ilo => selectedILOIds.includes(ilo.id)).map(ilo => ilo.code).join(', ')
                        : 'Select ILO(s)'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>Select ILOs on the first page</Text>
                )}
                {a.showILOSelect && selectedILOOptions.length > 0 && (
                  <View style={{ backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 6, padding: 8, zIndex: 10 }}>
                    {selectedILOOptions.map(ilo => {
                      const checked = selectedILOIds.includes(ilo.id);
                      return (
                        <TouchableOpacity
                          key={ilo.id}
                          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                          onPress={() => {
                            let newSelected;
                            if (checked) {
                              newSelected = selectedILOIds.filter(id => id !== ilo.id);
                            } else {
                              newSelected = [...selectedILOIds, ilo.id];
                            }
                            handleAssessmentILOChange(idx, newSelected);
                          }}
                        >
                          <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#DC2626', marginRight: 10, backgroundColor: checked ? '#DC2626' : '#fff', justifyContent: 'center', alignItems: 'center' }}>
                            {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                          </View>
                          <Text style={{ color: '#1E293B', fontSize: 14, fontWeight: checked ? 'bold' : 'normal' }}>{ilo.code} - {ilo.description}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
              {/* Weights Section (editable) */}
              {selectedILOIds.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: '600', color: '#6366F1', fontSize: 14, marginBottom: 2 }}>Weights (total should not exceed 100%)</Text>
                  {selectedILOIds.map(iloId => {
                    const ilo = selectedILOOptions.find(i => i.id === iloId);
                    const weightObj = Array.isArray(a.weights) ? a.weights.find(w => w.ilo_id === iloId) : undefined;
                    return (
                      <View key={iloId} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: '#EEF2FF', borderRadius: 6, padding: 8 }}>
                        <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 13, minWidth: 60 }}>{ilo?.code}</Text>
                        <Text style={{ color: '#6366F1', fontSize: 13, flex: 1 }}>{ilo?.description}</Text>
              <TextInput
                          style={{ borderWidth: 1, borderColor: '#6366F1', borderRadius: 6, padding: 6, width: 60, marginLeft: 8, color: '#1E293B', fontWeight: 'bold', fontSize: 14, backgroundColor: '#fff' }}
                          value={weightObj ? String(weightObj.weight_percentage) : ''}
                          onChangeText={v => {
                            let val = v.replace(/[^0-9.]/g, '');
                            if (val.length > 0 && !isNaN(Number(val))) {
                              let num = Math.max(0, Math.min(100, Number(val)));
                              handleAssessmentWeightChange(idx, iloId, num);
                            } else if (val === '') {
                              handleAssessmentWeightChange(idx, iloId, '');
                            }
                          }}
                          placeholder="%"
                          keyboardType="numeric"
                          maxLength={5}
                        />
                        <Text style={{ color: '#6366F1', fontWeight: 'bold', marginLeft: 4 }}>%</Text>
            </View>
                    );
                  })}
                </View>
              )}
              {/* Assessment fields */}
              <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 15, marginBottom: 6 }}>Assessment {idx + 1}</Text>
              <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14 }}>Title</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 14 }}
                value={a.title}
                editable={true}
                placeholder="Assessment Title"
                onChangeText={v => handleAssessmentFieldChange(idx, 'title', v)}
              />
              <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14 }}>Type</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 8, fontSize: 14 }}
                value={a.type}
                editable={true}
                placeholder="Assessment Type"
                onChangeText={v => handleAssessmentFieldChange(idx, 'type', v)}
              />
              {formData.assessments.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveAssessment(idx)} style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 2 }}>
                  <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      ) : (
        <Text style={{ color: '#64748B' }}>No assessments found.</Text>
      )}
      <TouchableOpacity onPress={handleAddAssessment} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
        <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 15 }}>+ Add Assessment</Text>
      </TouchableOpacity>
      {/* Legend for assessment types */}
      {/* In renderStep2, update the legend to be vertically arranged */}
      <View style={{ marginTop: 18, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
        <Text style={{ fontWeight: 'bold', color: '#334155', fontSize: 14, marginBottom: 4 }}>Assessment Type Legend:</Text>
        <View style={{ gap: 2 }}>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>R</Text> = Recitation</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>D</Text> = Discussion</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>Q</Text> = Quiz</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>E</Text> = Exam</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>P</Text> = Project</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>L</Text> = Laboratory</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}><Text style={{ fontWeight: 'bold', color: '#DC2626' }}>O</Text> = Others</Text>
        </View>
      </View>
    </View>
  );

  // Step 3: Rubrics (read-only for now)
  const renderStep3 = () => (
    <View style={modalContainerStyle}>
      <Text style={sectionHeaderStyle}>Rubrics</Text>
      {Array.isArray(formData.assessments) && formData.assessments.length > 0 ? (
        formData.assessments.map((a, idx) => (
          <View key={a.id || idx} style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', color: '#DC2626', fontSize: 15, marginBottom: 4 }}>{a.title}</Text>
            {Array.isArray(a.rubrics) && a.rubrics.length > 0 ? (
              a.rubrics.map((r, ridx) => {
                const selectedILOs = formData.selectedILOs || [];
                const iloOptions = Array.isArray(selectedILOs) ? selectedILOs : [];
                const hasILOs = iloOptions.length > 0;
                // Always use a valid value for Picker
                let rubricILOId = r.ilo_id;
                if (!rubricILOId || !iloOptions.some(ilo => ilo.id === rubricILOId)) {
                  rubricILOId = hasILOs ? iloOptions[0].id : '';
                }
                // Check if a weight is set for this ILO in the parent assessment
                const hasWeight = Array.isArray(a.weights) && a.weights.some(w => w.ilo_id === rubricILOId);
                return (
                  <View key={r.rubric_id || ridx} style={cardStyle}>
                    <View>
                      {/* Linked ILO selection dropdown (card style) */}
                      <View style={{ marginBottom: 6 }}>
                        <Text style={{ fontWeight: '600', color: '#1E293B', fontSize: 14, marginBottom: 2 }}>Select ILO for this Rubric:</Text>
                        {iloOptions.length > 0 ? (
                          <TouchableOpacity
                            style={{ backgroundColor: '#F3F4F6', borderRadius: 6, padding: 8, minHeight: 36, borderWidth: 1, borderColor: '#E5E7EB' }}
                            onPress={() => setFormData(prev => ({
                              ...prev,
                              assessments: prev.assessments.map((assess, i) =>
                                i === idx ? {
                                  ...assess,
                                  rubrics: assess.rubrics.map((rub, rIdx) =>
                                    rIdx === ridx ? { ...rub, showILOSelect: !rub.showILOSelect } : { ...rub, showILOSelect: false }
                                  )
                                } : assess
                              )
                            }))}
                          >
                            <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 14 }}>
                              {iloOptions.find(ilo => ilo.id === rubricILOId)?.code || 'Select ILO'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>Select ILOs on the first page</Text>
                        )}
                        {r.showILOSelect && iloOptions.length > 0 && (
                          <View style={{ backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 6, padding: 8, zIndex: 10 }}>
                            {/* Unselect option */}
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                              onPress={() => handleRubricILOChange(idx, ridx, '')}
                            >
                              <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#DC2626', marginRight: 10, backgroundColor: rubricILOId === '' ? '#DC2626' : '#fff', justifyContent: 'center', alignItems: 'center' }}>
                                {rubricILOId === '' && <Ionicons name="close" size={14} color="#fff" />}
                              </View>
                              <Text style={{ color: '#1E293B', fontSize: 14, fontWeight: rubricILOId === '' ? 'bold' : 'normal' }}>None</Text>
                            </TouchableOpacity>
                            {iloOptions.map(ilo => {
                              const checked = rubricILOId === ilo.id;
                              return (
                                <TouchableOpacity
                                  key={ilo.id}
                                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                                  onPress={() => handleRubricILOChange(idx, ridx, checked ? '' : ilo.id)}
                                >
                                  <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#DC2626', marginRight: 10, backgroundColor: checked ? '#DC2626' : '#fff', justifyContent: 'center', alignItems: 'center' }}>
                                    {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                                  </View>
                                  <Text style={{ color: '#1E293B', fontSize: 14, fontWeight: checked ? 'bold' : 'normal' }}>{ilo.code} - {ilo.description}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                      {/* Show warning if no weight is set for this ILO */}
                      {!hasWeight && (
                        <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 6 }}>Warning: No weight set for this ILO in the assessment. Please set a weight in Step 2.</Text>
                      )}
                      {/* Rubric fields (editable) */}
                      <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 14 }}>Title</Text>
              <TextInput
                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 }}
                        value={r.title}
                        editable={true}
                        onChangeText={v => handleRubricFieldChange(idx, ridx, 'title', v)}
                      />
                      <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 14 }}>Description</Text>
              <TextInput
                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 }}
                        value={r.description}
                        editable={true}
                        onChangeText={v => handleRubricFieldChange(idx, ridx, 'description', v)}
                      />
                      <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 14 }}>Criterion</Text>
              <TextInput
                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 }}
                        value={r.criterion}
                        editable={true}
                        onChangeText={v => handleRubricFieldChange(idx, ridx, 'criterion', v)}
                      />
                      <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 14 }}>Max Score</Text>
              <TextInput
                        style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 }}
                        value={String(r.max_score)}
                        editable={true}
                        onChangeText={v => handleRubricFieldChange(idx, ridx, 'max_score', v.replace(/[^0-9]/g, ''))}
                      />
                      <TouchableOpacity onPress={() => handleRemoveRubric(idx, ridx)} style={{ alignSelf: 'flex-end', marginTop: 4, marginBottom: 2 }}>
                        <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Remove</Text>
                      </TouchableOpacity>
            </View>
          </View>
                );
              })
            ) : (
              <Text style={{ color: '#64748B' }}>No rubrics found.</Text>
            )}
            <TouchableOpacity onPress={() => handleAddRubric(idx)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
              <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 15 }}>+ Add Rubric</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={{ color: '#64748B' }}>No assessments/rubrics found.</Text>
      )}
    </View>
  );

  // Navigation buttons
  const renderStepNavigation = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 }}>
      {step > 1 && (
        <TouchableOpacity style={[styles.previewButton, { flex: 1, marginRight: 10, paddingVertical: 18, paddingHorizontal: 24, marginVertical: 10 }]} onPress={() => setStep(step - 1)}>
          <Text style={[styles.previewButtonText, { fontSize: 18 }]}>Back</Text>
            </TouchableOpacity>
      )}
      {step < totalSteps && (
        <TouchableOpacity style={[styles.submitButton, { flex: 1, marginLeft: step > 1 ? 10 : 0, paddingVertical: 18, paddingHorizontal: 12, marginVertical: 10 }]} onPress={() => setStep(step + 1)}>
          <Text style={[styles.submitButtonText, { fontSize: 18 }]}>Next</Text>
            </TouchableOpacity>
      )}
      {step === totalSteps && (
        <TouchableOpacity style={[styles.submitButton, { flex: 2, marginLeft: step > 1 ? 10 : 0, paddingVertical: 18, paddingHorizontal: 24, marginVertical: 10 }]} onPress={handleSubmit}>
          <Text style={[styles.submitButtonText, { fontSize: 18 }]}>Save/Submit</Text>
        </TouchableOpacity>
      )}
          </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FacultySyllabiCreationHeader onSaveDraft={handleSaveDraft} />

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
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