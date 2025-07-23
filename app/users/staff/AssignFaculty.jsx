import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import apiClient from '../../../utils/api';
import { useModal } from '../../../utils/useModal';
import StaffAssignFacultyHeader from '../../components/StaffAssignFacultyHeader';

// Remove mock data for classes and faculty
const mockClassList = [];
const mockFaculty = [];
// TODO: Fetch real class/section and faculty data from backend and populate these arrays

// Class Card Component
const ClassCard = ({ cls, currentFaculty, onCardPress }) => {
  return (
    <ClickableContainer style={styles.classContainer} onPress={() => onCardPress(cls, currentFaculty)}>
      <View style={styles.classHeader}>
        <Ionicons name="school-outline" size={28} color="#DC2626" style={{ marginRight: 10 }} />
        <View style={styles.classInfo}>
          <Text style={styles.classSubject}>{cls.subject} <Text style={styles.classCode}>({cls.code})</Text></Text>
          <Text style={styles.classSection}>Section: <Text style={styles.classSectionValue}>{cls.section}</Text></Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>
      <View style={styles.classDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Faculty:</Text>
          <Text style={styles.detailValue}>{currentFaculty}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Schedule:</Text>
          <Text style={styles.detailValue}>{cls.schedule}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room:</Text>
          <Text style={styles.detailValue}>{cls.room}</Text>
        </View>
      </View>
    </ClickableContainer>
  );
};

export default function AssignFaculty() {
  // Track selected faculty for each class
  const [facultyAssignments, setFacultyAssignments] = useState(
    mockClassList.reduce((acc, cls) => {
      acc[cls.id] = cls.currentFaculty;
      return acc;
    }, {})
  );
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Assignment form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  // TODO: Fetch these from backend
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [terms, setTerms] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const { visible, selectedItem: selectedClass, openModal, closeModal } = useModal();
  // Remove DropDownPicker state for courses
  const [courseQuery, setCourseQuery] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [selectedCourseLabel, setSelectedCourseLabel] = useState('');
  const [draftSyllabusId, setDraftSyllabusId] = useState(null);
  const [draftSectionCourseId, setDraftSectionCourseId] = useState(null);
  // Add state for assigned section_courses
  const [assignedSectionCourses, setAssignedSectionCourses] = useState([]);

  console.log('terms:', terms);
  console.log('sections:', sections);
  console.log('facultyList:', facultyList);

  // Filter courses based on query
  const filteredCourses = courseQuery
    ? courses.filter(c => (c.title || c.name || '').toLowerCase().includes(courseQuery.toLowerCase()))
    : courses;

  // Update courseItems when courses change
  useEffect(() => {
    // setCourseItems(Array.isArray(courses)
    //   ? courses.map(c => ({ label: c.title || c.name, value: c.course_id || c.id }))
    //   : []);
  }, [courses]);

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (showAssignmentModal) {
      console.log('Opening Assign Faculty modal, starting API fetches...');
      // Fetch courses
      console.log('Fetching courses from /courses');
      apiClient.get('/courses').then(data => {
        console.log('Fetched courses:', data);
        setCourses(Array.isArray(data) ? data : data.courses || []);
      }).catch((err) => {
        console.log('Error fetching courses:', err);
        setCourses([]);
      });
      // Fetch all sections
      console.log('Fetching sections from /section-courses/sections');
      apiClient.get('/section-courses/sections')
        .then(data => {
          console.log('Fetched sections:', data);
          setSections(Array.isArray(data) ? data : data.sections || []);
        })
        .catch((err) => {
          console.log('Error fetching sections:', err);
          setSections([]);
        });
      // Fetch terms
      console.log('Fetching terms from /section-courses/school-terms');
      apiClient.get('/section-courses/school-terms')
        .then(data => {
          console.log('Fetched terms:', data);
          setTerms(Array.isArray(data) ? data : data.terms || []);
        })
        .catch((err) => {
          console.log('Error fetching terms:', err);
          setTerms([]);
        });
      // Fetch faculty
      console.log('Fetching faculty from /section-courses/faculty');
      apiClient.get('/section-courses/faculty')
        .then(data => {
          console.log('Fetched faculty:', data);
          setFacultyList(Array.isArray(data) ? data : data.faculty || []);
        })
        .catch((err) => {
          console.log('Error fetching faculty:', err);
          setFacultyList([]);
        });
    }
  }, [showAssignmentModal]);

  // Filter sections by selected term only
  const filteredSections = selectedTerm
    ? sections.filter(s => String(s.term_id) === String(selectedTerm))
    : [];

  console.log('filteredSections:', filteredSections);

  const handleAssign = async (classId, facultyName) => {
    // Find the selected class and faculty object
    const cls = mockClassList.find(c => c.id === classId);
    const faculty = mockFaculty.find(f => f.name === facultyName);
    if (!cls || !faculty) {
      Alert.alert('Error', 'Invalid class or faculty selection.');
      return;
    }
    // TODO: Replace cls.id with real section_course_id and faculty.id with real user_id when using real data
    try {
      await apiClient.post('/section-courses/assign-instructor', {
        section_course_id: cls.id, // Replace with real section_course_id
        instructor_id: faculty.id, // Replace with real user_id
      });
      setFacultyAssignments((prev) => ({ ...prev, [classId]: facultyName }));
      Alert.alert('Success', `Assigned ${facultyName} to class ${cls.subject}`);
      closeModal();
    } catch (err) {
      Alert.alert('Error', 'Failed to assign faculty.');
    }
  };

  const handleCardPress = (cls, currentFaculty) => {
    openModal({ class: cls, currentFaculty });
  };

  const handleAssignmentSubmit = async () => {
    if (!selectedCourse || !selectedSection || !selectedTerm || !selectedFaculty) {
      Alert.alert('Error', 'Please select all fields.');
      return;
    }
    // TODO: Find the correct section_course_id for the selected section, course, and term
    // For now, just close the modal and show a success alert
    setShowAssignmentModal(false);
    Alert.alert('Success', 'Faculty assigned to section!');
    // You would call the backend here
    // await apiClient.post('/section-courses/assign-instructor', { section_course_id, instructor_id: selectedFaculty })
  };

  // Filter classes by search
  const filteredClasses = mockClassList.filter(cls => {
    const q = searchQuery.toLowerCase();
    return (
      cls.subject.toLowerCase().includes(q) ||
      cls.code.toLowerCase().includes(q) ||
      cls.section.toLowerCase().includes(q) ||
      cls.currentFaculty.toLowerCase().includes(q)
    );
  });

  // Fetch assigned section_courses on mount
  useEffect(() => {
    apiClient.get('/section-courses/assigned')
      .then(data => {
        console.log('Fetched assigned section courses:', data);
        setAssignedSectionCourses(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.log('Error fetching assigned section courses:', err);
        setAssignedSectionCourses([]);
      });
  }, []);

  const handleDeleteAssignment = async (section_course_id) => {
    Alert.alert(
      'Remove Assignment',
      'Are you sure you want to remove the assigned faculty from this class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting assignment for section_course_id:', section_course_id);
              const deleteRes = await apiClient.post('/section-courses/assign-instructor', {
                section_course_id,
                instructor_id: null
              });
              console.log('Delete assignment response:', deleteRes);
              // Refresh the assigned list
              const assignedList = await apiClient.get('/section-courses/assigned');
              console.log('Refetched assigned section courses:', assignedList);
              setAssignedSectionCourses(Array.isArray(assignedList) ? assignedList : []);
              Alert.alert('Success', 'Assignment removed.');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove assignment.');
            }
          }
        }
      ]
    );
  };

  // Render assigned classes
  const renderAssignedClasses = () => (
    <ScrollView style={{ marginTop: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
      {assignedSectionCourses.filter(sc => sc.faculty_name).map(sc => (
        <View key={sc.section_course_id} style={styles.syllabusCard}>
          <View style={styles.syllabusHeader}>
            <View style={styles.syllabusInfo}>
              <Text style={styles.syllabusTitle}>{sc.course_title} <Text style={styles.syllabusCode}>({sc.section_code})</Text></Text>
              <Text style={styles.syllabusTerm}>{sc.semester} {sc.school_year}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Assigned</Text>
            </View>
          </View>
          <Text style={styles.assignedFacultyLine}>
            Assigned Faculty: <Text style={styles.assignedFacultyName}>{sc.faculty_name}</Text>
          </Text>
          <TouchableOpacity onPress={() => handleDeleteAssignment(sc.section_course_id)} style={{ marginLeft: 12, padding: 6, alignSelf: 'flex-end' }}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderAssignmentModal = () => {
    if (!selectedClass) return null;

    const { class: cls, currentFaculty } = selectedClass;
    const selectedFaculty = facultyAssignments[cls.id];

    const modalFooter = (
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalCancelButton]}
          onPress={closeModal}
        >
          <Text style={styles.modalCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalAssignButton]}
          onPress={() => handleAssign(cls.id, selectedFaculty)}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
          <Text style={styles.modalAssignButtonText}>Assign Faculty</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <ModalContainer
        visible={visible}
        onClose={closeModal}
        title="Assign Faculty"
        footer={modalFooter}
      >
        <View style={styles.modalContent}>
          {/* Class Header */}
          <View style={styles.modalClassHeader}>
            <View style={styles.modalClassAvatar}>
              <Ionicons name="school-outline" size={32} color="#DC2626" />
            </View>
            <View style={styles.modalClassInfo}>
              <Text style={styles.modalClassCode}>{cls.code}</Text>
              <Text style={styles.modalClassTitle}>{cls.subject}</Text>
              <Text style={styles.modalClassSection}>{cls.section}</Text>
            </View>
          </View>

          {/* Class Details */}
          <View style={styles.modalClassDetails}>
            <Text style={styles.modalSectionTitle}>Class Information:</Text>
            <View style={styles.modalDetailGrid}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Schedule:</Text>
                <Text style={styles.modalDetailValue}>{cls.schedule}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Room:</Text>
                <Text style={styles.modalDetailValue}>{cls.room}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="school-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Credits:</Text>
                <Text style={styles.modalDetailValue}>{cls.credits}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Enrollment:</Text>
                <Text style={styles.modalDetailValue}>{cls.enrollment}/{cls.maxEnrollment}</Text>
              </View>
            </View>
          </View>

          {/* Current Faculty */}
          <View style={styles.modalCurrentFaculty}>
            <Text style={styles.modalSectionTitle}>Current Faculty:</Text>
            <View style={styles.modalFacultyCard}>
              <View style={styles.modalFacultyAvatar}>
                <Text style={styles.modalFacultyAvatarText}>{currentFaculty.charAt(0)}</Text>
              </View>
              <View style={styles.modalFacultyInfo}>
                <Text style={styles.modalFacultyName}>{currentFaculty}</Text>
                <Text style={styles.modalFacultyStatus}>Currently Assigned</Text>
              </View>
            </View>
          </View>

          {/* Faculty Selection */}
          <View style={styles.modalFacultySelection}>
            <Text style={styles.modalSectionTitle}>Select New Faculty:</Text>
            <View style={styles.modalFacultyList}>
              {mockFaculty.map((faculty) => (
                <TouchableOpacity
                  key={faculty.id}
                  style={[
                    styles.modalFacultyOption,
                    selectedFaculty === faculty.name && styles.modalFacultyOptionSelected
                  ]}
                  onPress={() => setFacultyAssignments((prev) => ({ ...prev, [cls.id]: faculty.name }))}
                >
                  <View style={styles.modalFacultyOptionHeader}>
                    <View style={styles.modalFacultyOptionAvatar}>
                      <Text style={styles.modalFacultyOptionAvatarText}>{faculty.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.modalFacultyOptionInfo}>
                      <Text style={styles.modalFacultyOptionName}>{faculty.name}</Text>
                      <Text style={styles.modalFacultyOptionPosition}>{faculty.position}</Text>
                    </View>
                    {selectedFaculty === faculty.name && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  <View style={styles.modalFacultyOptionDetails}>
                    <Text style={styles.modalFacultyOptionDetail}>Department: {faculty.department}</Text>
                    <Text style={styles.modalFacultyOptionDetail}>Load: {faculty.currentLoad}/{faculty.maxLoad}</Text>
                    <Text style={styles.modalFacultyOptionDetail}>Experience: {faculty.yearsOfExperience} years</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ModalContainer>
    );
  };

  // Helper functions to get labels
  const selectedTermObj = terms.find(t => String(t.term_id) === String(selectedTerm));
  const selectedSectionObj = sections.find(s => String(s.section_id) === String(selectedSection));
  const selectedFacultyObj = facultyList.find(f => String(f.user_id) === String(selectedFaculty));

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleConfirmAssignment = async () => {
    // Create draft syllabus and section_course after user confirms
    try {
      const payload = {
        course_id: selectedCourse,
        term_id: selectedTerm,
        section_id: selectedSection,
        created_by: selectedFaculty
      };
      console.log('Creating draft syllabus with payload:', payload);
      const draftRes = await apiClient.post('/syllabus/draft', payload);
      console.log('Draft syllabus creation response:', draftRes);
      setDraftSyllabusId(draftRes.syllabus?.syllabus_id);
      setDraftSectionCourseId(draftRes.section_course_id);
      Alert.alert('Success', 'Faculty assigned to section and draft syllabus created!');
      // Refresh the assigned list
      const assignedList = await apiClient.get('/section-courses/assigned');
      console.log('Refetched assigned section courses after assignment:', assignedList);
      setAssignedSectionCourses(Array.isArray(assignedList) ? assignedList : []);
      setShowAssignmentModal(false);
      setShowPreview(false);
    } catch (err) {
      console.log('Error creating draft syllabus:', err);
      Alert.alert('Error', 'Failed to create draft syllabus.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StaffAssignFacultyHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        // Removed isTableView and setIsTableView props
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onAddAssignment={() => setShowAssignmentModal(true)}
      />
      
      <View style={styles.content}>
        {/* Removed table view and toggle logic. Only card view remains. */}
        {filteredClasses.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            currentFaculty={facultyAssignments[cls.id]}
            onCardPress={handleCardPress}
          />
        ))}
      </View>
      {renderAssignedClasses()}
      {renderAssignmentModal()}
      {/* Assignment Modal (placeholder) */}
      <ModalContainer
        visible={showAssignmentModal}
        onClose={() => { setShowAssignmentModal(false); setShowPreview(false); }}
        title={showPreview ? 'Preview Faculty Assignment' : 'Preview Faculty Assignment'}
      >
        <View style={{ padding: 16 }}>
          {showPreview ? (
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Preview Assignment</Text>
              <Text style={{ marginBottom: 4 }}>Course: {selectedCourseLabel}</Text>
              <Text style={{ marginBottom: 4 }}>Term: {selectedTermObj ? `${selectedTermObj.semester} ${selectedTermObj.school_year}` : ''}</Text>
              <Text style={{ marginBottom: 4 }}>Section: {selectedSectionObj ? selectedSectionObj.section_code : ''}</Text>
              <Text style={{ marginBottom: 4 }}>Faculty: {selectedFacultyObj ? selectedFacultyObj.name : ''}</Text>
              {/* Syllabi data preview */}
              <View style={{ marginTop: 12, marginBottom: 8, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Syllabi Data to Insert:</Text>
                <Text style={{ fontSize: 13 }}>course_id: {selectedCourse}</Text>
                <Text style={{ fontSize: 13 }}>term_id: {selectedTerm}</Text>
                <Text style={{ fontSize: 13 }}>created_by (faculty user_id): {selectedFaculty}</Text>
                <Text style={{ fontSize: 13 }}>status: draft</Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#10B981', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 }}
                onPress={handleConfirmAssignment}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirm Assignment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 16, color: '#353A40', marginBottom: 8 }}>Select Course</Text>
              <View style={{ marginBottom: 16, position: 'relative' }}>
                <TextInput
                  value={selectedCourseLabel || courseQuery}
                  onChangeText={text => {
                    setCourseQuery(text);
                    setSelectedCourse('');
                    setSelectedCourseLabel('');
                    setShowCourseDropdown(true);
                  }}
                  placeholder="Type to search courses..."
                  style={{
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    backgroundColor: '#fff'
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                />
                {showCourseDropdown && filteredCourses.length > 0 && (
                  <ScrollView
                    style={{
                      position: 'absolute',
                      top: 50,
                      left: 0,
                      right: 0,
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 8,
                      zIndex: 1000,
                      maxHeight: 220
                    }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredCourses.map(c => (
                      <TouchableOpacity
                        key={c.course_id || c.id}
                        onPress={() => {
                          setSelectedCourse(c.course_id || c.id);
                          setSelectedCourseLabel(c.title || c.name);
                          setCourseQuery('');
                          setShowCourseDropdown(false);
                        }}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: '#F3F4F6',
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 16, color: '#353A40' }}>{c.title || c.name}</Text>
                        {c.course_code && (
                          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{`Code: ${c.course_code}`}</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              <Text style={{ fontSize: 16, color: '#353A40', marginBottom: 12 }}>Select Term</Text>
              <Picker
                selectedValue={selectedTerm}
                onValueChange={setSelectedTerm}
                style={{ marginBottom: 12 }}
              >
                <Picker.Item label="Select a term..." value="" />
                {Array.isArray(terms) && terms.map(t => (
                  <Picker.Item
                    key={t.term_id}
                    label={`${t.semester} ${t.school_year}`}
                    value={t.term_id}
                  />
                ))}
              </Picker>

              <Text style={{ fontSize: 16, color: '#353A40', marginBottom: 12 }}>Select Section</Text>
              <Picker
                selectedValue={selectedSection}
                onValueChange={setSelectedSection}
                style={{ marginBottom: 12 }}
              >
                <Picker.Item label="Select a section..." value="" />
                {Array.isArray(filteredSections) && filteredSections.map(s => (
                  <Picker.Item key={s.section_id} label={s.section_code} value={s.section_id} />
                ))}
              </Picker>
              <Text style={{ fontSize: 16, color: '#353A40', marginBottom: 12 }}>Select Faculty</Text>
              <Picker
                selectedValue={selectedFaculty}
                onValueChange={setSelectedFaculty}
                style={{ marginBottom: 12 }}
              >
                <Picker.Item label="Select a faculty..." value="" />
                {Array.isArray(facultyList) && facultyList.map(f => (
                  <Picker.Item key={f.user_id} label={f.name} value={f.user_id} />
                ))}
              </Picker>
              <TouchableOpacity
                style={{ backgroundColor: '#DC2626', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 }}
                onPress={handlePreview}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Preview</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ModalContainer>
    </ScrollView>
  );
}

// Add styles at the bottom of the file
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
  tableViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 15,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 15,
    color: '#353A40',
    paddingHorizontal: 6,
  },
  assignButtonSmall: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonSmallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  classContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 17,
    fontWeight: '600',
    color: '#353A40',
  },
  classCode: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  classSection: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  classSectionValue: {
    fontWeight: '600',
    color: '#DC2626',
  },
  classDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '600',
    flex: 1,
  },
  // Modal Styles
  modalContent: {
    padding: 16,
  },
  modalClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalClassAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalClassInfo: {
    flex: 1,
  },
  modalClassCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  modalClassTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  modalClassSection: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalClassDetails: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  modalDetailGrid: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    width: 80,
    marginLeft: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  modalCurrentFaculty: {
    marginBottom: 20,
  },
  modalFacultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  modalFacultyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalFacultyAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalFacultyInfo: {
    flex: 1,
  },
  modalFacultyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  modalFacultyStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalFacultySelection: {
    marginBottom: 20,
  },
  modalFacultyList: {
    gap: 8,
  },
  modalFacultyOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalFacultyOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  modalFacultyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalFacultyOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalFacultyOptionAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  modalFacultyOptionInfo: {
    flex: 1,
  },
  modalFacultyOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  modalFacultyOptionPosition: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalFacultyOptionDetails: {
    marginLeft: 48,
  },
  modalFacultyOptionDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
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
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  modalAssignButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalAssignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assignedCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assignedInfo: {
    flex: 1,
  },
  assignedTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#DC2626',
  },
  assignedSub: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  assignedFaculty: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 15,
  },
  assignedFacultyUnassigned: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  syllabusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    // Removed maxWidth and alignSelf for full-width stretch
  },
  syllabusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  syllabusInfo: {
    flex: 1,
    minWidth: 0,
  },
  syllabusTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#DC2626',
  },
  syllabusCode: {
    color: '#6B7280',
    fontWeight: 'normal',
    fontSize: 15,
  },
  syllabusTerm: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: 2,
  },
  statusText: {
    color: '#6366F1',
    fontWeight: 'bold',
    fontSize: 13,
  },
  assignedFacultyLine: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 4,
  },
  assignedFacultyName: {
    color: '#10B981',
    fontWeight: 'bold',
  },
});

 