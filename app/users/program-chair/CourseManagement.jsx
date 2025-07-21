import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import programService from '../../../utils/programService';
import ProgramChairCourseManagementHeader from '../../components/ProgramChairCourseManagementHeader';

// Removed shadow styles for flat design consistency

export default function CourseManagementScreen() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('programs'); // Default to 'programs' now
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Search and view state
  const [showContainers, setShowContainers] = useState(false);
  const [isTableView, setIsTableView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all'); // 'all', '1st', '2nd', 'summer'
  
  // New state for real data
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Load all data on component mount
  useEffect(() => {
    loadPrograms();
    loadSpecializations();
    loadDepartments();
    loadCourses();
    loadTerms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const programsData = await programService.getPrograms();
      setPrograms(programsData);
    } catch (error) {
      console.error('Error loading programs:', error);
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecializations = async () => {
    try {
      const specializationsData = await programService.getSpecializations();
      setSpecializations(specializationsData);
    } catch (error) {
      console.error('Error loading specializations:', error);
      setError('Failed to load specializations');
    }
  };

  const loadDepartments = async () => {
    try {
      const departmentsData = await programService.getDepartments();
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Failed to load departments');
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await programService.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    }
  };

  const loadTerms = async () => {
    try {
      const termsData = await programService.getTerms();
      setTerms(termsData);
    } catch (error) {
      console.error('Error loading terms:', error);
      setError('Failed to load terms');
    }
  };

  // Search functionality
  const onSearch = () => {
    // Trigger search logic if needed
    console.log('Searching for:', searchTerm);
  };

  const filterData = (data) => {
    let filteredData = data;
    
    // Apply semester filter (only for courses)
    if (activeTab === 'courses' && semesterFilter !== 'all') {
      filteredData = filteredData.filter(item => {
        const semester = item.semester?.toLowerCase() || '';
        switch (semesterFilter) {
          case '1st':
            return semester.includes('1st') || semester.includes('first');
          case '2nd':
            return semester.includes('2nd') || semester.includes('second');
          case 'summer':
            return semester.includes('summer') || semester.includes('midyear');
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (!searchTerm.trim()) return filteredData;
    
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    
    return filteredData.filter(item => {
      switch (activeTab) {
        case 'programs':
          return (
            item.name?.toLowerCase().includes(lowerSearchTerm) ||
            item.program_abbreviation?.toLowerCase().includes(lowerSearchTerm) ||
            item.department_name?.toLowerCase().includes(lowerSearchTerm) ||
            item.description?.toLowerCase().includes(lowerSearchTerm)
          );
        case 'specializations':
          return (
            item.name?.toLowerCase().includes(lowerSearchTerm) ||
            item.abbreviation?.toLowerCase().includes(lowerSearchTerm) ||
            item.program_name?.toLowerCase().includes(lowerSearchTerm) ||
            item.description?.toLowerCase().includes(lowerSearchTerm)
          );
        case 'courses':
          return (
            item.title?.toLowerCase().includes(lowerSearchTerm) ||
            item.course_code?.toLowerCase().includes(lowerSearchTerm) ||
            item.specialization_name?.toLowerCase().includes(lowerSearchTerm) ||
            item.program_name?.toLowerCase().includes(lowerSearchTerm) ||
            item.description?.toLowerCase().includes(lowerSearchTerm)
          );
        default:
          return true;
      }
    });
  };

  const getTabData = () => {
    let data;
    switch (activeTab) {
      case 'programs':
        data = programs;
        break;
      case 'specializations':
        // Sort specializations to show general ones first
        data = [...specializations].sort((a, b) => {
          const aIsGeneral = isGeneralSpecialization(a);
          const bIsGeneral = isGeneralSpecialization(b);
          
          // If one is general and the other isn't, general comes first
          if (aIsGeneral && !bIsGeneral) return -1;
          if (!aIsGeneral && bIsGeneral) return 1;
          
          // If both are general or both are not general, sort alphabetically by name
          return (a.name || '').localeCompare(b.name || '');
        });
        break;
      case 'courses':
        data = courses;
        break;
      default:
        data = [];
    }
    
    // Apply filtering
    return filterData(data);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'programs':
        return 'Programs';
      case 'specializations':
        return 'Majors';
      case 'courses':
        return 'Courses';
      default:
        return '';
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
    setFormData({});
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({});
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    
    if (activeTab === 'programs') {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        program_abbreviation: item.program_abbreviation || '',
        department_id: item.department_id,
        department_name: item.department_name || ''
      });
    } else if (activeTab === 'specializations') {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        abbreviation: item.abbreviation || '',
        program_id: item.program_id,
        program_name: item.program_name || ''
      });
    } else if (activeTab === 'courses') {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        course_code: item.course_code || '',
        specialization_id: item.specialization_id || null,
        specialization_name: item.specialization_name || null,
        term_id: item.term_id || null,
        term_display: item.school_year && item.semester ? `${item.school_year} ${item.semester}` : null
      });
    }
    
    setShowEditModal(true);
  };

  const handleDelete = async (item) => {
    // Check for references before allowing delete
    if (activeTab === 'programs') {
      const hasSpecializations = specializations.some(spec => spec.program_id === item.program_id);
      const hasCourses = courses.some(course => {
        const spec = specializations.find(spec => spec.specialization_id === course.specialization_id);
        return spec && spec.program_id === item.program_id;
      });
      if (hasSpecializations || hasCourses) {
        Alert.alert('Cannot Delete', 'This program cannot be deleted because it is referenced by existing specializations or courses.');
        return;
      }
    } else if (activeTab === 'specializations') {
      const hasCourses = courses.some(course => course.specialization_id === item.specialization_id);
      if (hasCourses) {
        Alert.alert('Cannot Delete', 'This specialization cannot be deleted because it is referenced by existing courses.');
        return;
      }
    }
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'programs') {
                await programService.deleteProgram(item.program_id);
                // Reload programs after delete
                await loadPrograms();
              } else if (activeTab === 'specializations') {
                await programService.deleteSpecialization(item.specialization_id);
                // Reload specializations after delete
                await loadSpecializations();
              } else if (activeTab === 'courses') {
                await programService.deleteCourse(item.course_id);
                // Reload courses after delete
                await loadCourses();
              } else {
                // For other tabs, show placeholder message
                Alert.alert('Success', `${activeTab.slice(0, -1)} deleted successfully!`);
              }
            } catch (error) {
              console.error('Error deleting:', error);
              Alert.alert('Error', error.message || 'Failed to delete. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    try {
      // Validate based on active tab
      if (activeTab === 'programs') {
        // Validate program fields
        if (!formData.name?.trim()) {
          Alert.alert('Validation Error', 'Program name is required');
          return;
        }
        if (!formData.program_abbreviation?.trim()) {
          Alert.alert('Validation Error', 'Program abbreviation is required');
          return;
        }
        if (!formData.department_id) {
          Alert.alert('Validation Error', 'Please select a department');
          return;
        }

        const programData = {
          name: formData.name.trim(),
          program_abbreviation: formData.program_abbreviation.trim(),
          description: formData.description?.trim() || null,
          department_id: formData.department_id
        };

        if (showEditModal) {
          await programService.updateProgram(selectedItem.program_id, programData);
          Alert.alert('Success', 'Program updated successfully!');
          setShowEditModal(false);
        } else {
          await programService.createProgram(programData);
          Alert.alert('Success', 'Program created successfully!');
          setShowAddModal(false);
        }
        await loadPrograms();

      } else if (activeTab === 'specializations') {
        // Validate specialization fields
        if (!formData.name?.trim()) {
          Alert.alert('Validation Error', 'Specialization name is required');
          return;
        }
        if (!formData.abbreviation?.trim()) {
          Alert.alert('Validation Error', 'Specialization abbreviation is required');
          return;
        }
        if (!formData.program_id) {
          Alert.alert('Validation Error', 'Please select a program');
          return;
        }

        const specializationData = {
          name: formData.name.trim(),
          abbreviation: formData.abbreviation.trim(),
          description: formData.description?.trim() || null,
          program_id: formData.program_id
        };

        if (showEditModal) {
          await programService.updateSpecialization(selectedItem.specialization_id, specializationData);
          Alert.alert('Success', 'Specialization updated successfully!');
          setShowEditModal(false);
        } else {
          await programService.createSpecialization(specializationData);
          Alert.alert('Success', 'Specialization created successfully!');
          setShowAddModal(false);
        }
        await loadSpecializations();

      } else if (activeTab === 'courses') {
        // Validate course fields
        if (!formData.title?.trim()) {
          Alert.alert('Validation Error', 'Course title is required');
          return;
        }
        if (!formData.course_code?.trim()) {
          Alert.alert('Validation Error', 'Course code is required');
          return;
        }

        const courseData = {
          title: formData.title.trim(),
          course_code: formData.course_code.trim(),
          description: formData.description?.trim() || null,
          specialization_id: formData.specialization_id || null,
          term_id: formData.term_id || null
        };

        if (showEditModal) {
          await programService.updateCourse(selectedItem.course_id, courseData);
          Alert.alert('Success', 'Course updated successfully!');
          setShowEditModal(false);
        } else {
          await programService.createCourse(courseData);
          Alert.alert('Success', 'Course created successfully!');
          setShowAddModal(false);
        }
        await loadCourses();
      }
      
      setFormData({});
      setSelectedItem(null);
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('Error', error.message || 'Failed to save. Please try again.');
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    // Refresh all data when switching tabs to ensure counts are accurate
    await refreshAllData();
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPrograms(),
        loadSpecializations(),
        loadDepartments(),
        loadCourses(),
        loadTerms()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (tab, label, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => handleTabChange(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? '#DC2626' : '#6B7280'} 
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Helper function to check if a specialization is considered "general"
  const isGeneralSpecialization = (spec) => {
    if (!spec) return false;
    const name = spec.name?.toLowerCase() || '';
    const abbreviation = spec.abbreviation?.toLowerCase() || '';
    return name.includes('general') || abbreviation === 'gen' || abbreviation === 'general';
  };

  // Helper function to check if a course is considered "general"
  const isGeneralCourse = (course) => {
    // Course is general if it has no specialization assigned (specialization_id is null)
    return !course.specialization_id;
  };

  const renderProgramCard = (program) => {
    // Calculate specializations count for this program (excluding general specializations)
    const specializationCount = specializations.filter(spec => 
      spec.program_id === program.program_id && !isGeneralSpecialization(spec)
    ).length;
    
    // Calculate courses count for this program
    const programSpecializations = specializations.filter(spec => 
      spec.program_id === program.program_id
    );
    const programSpecializationIds = programSpecializations.map(spec => spec.specialization_id);
    
    // Count both general courses (for this program context) and specialization courses
    const specializationCourseCount = courses.filter(course => 
      !isGeneralCourse(course) && programSpecializationIds.includes(course.specialization_id)
    ).length;
    
    // For general courses, we'll include them in all programs since they're common
    const generalCourseCount = courses.filter(course => isGeneralCourse(course)).length;
    
    const courseCount = specializationCourseCount + generalCourseCount;

    return (
      <View key={program.program_id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{program.name}</Text>
            <Text style={styles.cardSubtitle}>{program.program_abbreviation}</Text>
            <Text style={styles.cardDepartment}>{program.department_name}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(program)}>
              <Ionicons name="pencil" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(program)}>
              <Ionicons name="trash" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardDescription}>{program.description || 'No description available'}</Text>
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{specializationCount}</Text>
            <Text style={styles.statLabel}>Majors</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{courseCount}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSpecializationCard = (spec) => {
    // Calculate courses count for this specialization (excluding general courses)
    const courseCount = courses.filter(course => 
      course.specialization_id === spec.specialization_id && !isGeneralCourse(course)
    ).length;

    return (
      <View key={spec.specialization_id} style={[styles.card, isGeneralSpecialization(spec) && styles.generalCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {spec.name}
              {isGeneralSpecialization(spec) && (
                <Text style={styles.generalIndicator}> (General)</Text>
              )}
            </Text>
            <Text style={styles.cardSubtitle}>{spec.abbreviation}</Text>
            <Text style={styles.cardDepartment}>{spec.program_name}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(spec)}>
              <Ionicons name="pencil" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(spec)}>
              <Ionicons name="trash" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardDescription}>{spec.description}</Text>
        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{courseCount}</Text>
            <Text style={styles.statLabel}>
              {isGeneralSpecialization(spec) ? 'Specific Courses' : 'Courses'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCourseCard = (course) => (
    <View key={course.course_id} style={[styles.card, isGeneralCourse(course) && styles.generalCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>
            {course.title}
            {isGeneralCourse(course) && (
              <Text style={styles.generalIndicator}> (General)</Text>
            )}
          </Text>
          <Text style={styles.cardSubtitle}>{course.course_code}</Text>
          <Text style={styles.cardDepartment}>
            {course.specialization_name || 'No specialization assigned'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(course)}>
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(course)}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDescription}>{course.description || 'No description available'}</Text>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>
            {course.school_year && course.semester ? `${course.school_year} ${course.semester}` : 'No term assigned'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>
            {course.program_name || 'No program'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCard = (item) => {
    switch (activeTab) {
      case 'programs':
        return renderProgramCard(item);
      case 'specializations':
        return renderSpecializationCard(item);
      case 'courses':
        return renderCourseCard(item);
      default:
        return null;
    }
  };

  const renderTableHeader = () => {
    switch (activeTab) {
      case 'programs':
        return (
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Program Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Abbreviation</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Department</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Majors</Text>
            <Text style={[styles.tableHeaderCell, { width: 100 }]}>Courses</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
          </View>
        );
      case 'specializations':
        return (
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Major Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Abbreviation</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Program</Text>
            <Text style={[styles.tableHeaderCell, { width: 100 }]}>Courses</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
          </View>
        );
      case 'courses':
        return (
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 220 }]}>Course Title</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Course Code</Text>
            <Text style={[styles.tableHeaderCell, { width: 180 }]}>Specialization</Text>
            <Text style={[styles.tableHeaderCell, { width: 140 }]}>Term</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item, index) => {
    switch (activeTab) {
      case 'programs':
        const specializationCount = specializations.filter(spec => 
          spec.program_id === item.program_id && !isGeneralSpecialization(spec)
        ).length;
        
        const programSpecializations = specializations.filter(spec => 
          spec.program_id === item.program_id
        );
        const programSpecializationIds = programSpecializations.map(spec => spec.specialization_id);
        
        const specializationCourseCount = courses.filter(course => 
          !isGeneralCourse(course) && programSpecializationIds.includes(course.specialization_id)
        ).length;
        
        const generalCourseCount = courses.filter(course => isGeneralCourse(course)).length;
        const courseCount = specializationCourseCount + generalCourseCount;

        return (
          <View key={item.program_id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.tableCell, { width: 120 }]}>{item.program_abbreviation}</Text>
            <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>{item.department_name}</Text>
            <Text style={[styles.tableCell, { width: 120 }]}>{specializationCount}</Text>
            <Text style={[styles.tableCell, { width: 100 }]}>{courseCount}</Text>
            <View style={[styles.tableCell, { width: 120, flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'specializations':
        const specCourseCount = courses.filter(course => 
          course.specialization_id === item.specialization_id && !isGeneralCourse(course)
        ).length;

        return (
          <View key={item.specialization_id} style={[styles.tableRow, isGeneralSpecialization(item) && styles.generalTableRow]}>
            <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>
              {item.name}
              {isGeneralSpecialization(item) && <Text style={styles.generalIndicatorTable}> (General)</Text>}
            </Text>
            <Text style={[styles.tableCell, { width: 120 }]}>{item.abbreviation}</Text>
            <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>{item.program_name}</Text>
            <Text style={[styles.tableCell, { width: 100 }]}>{specCourseCount}</Text>
            <View style={[styles.tableCell, { width: 120, flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'courses':
        return (
          <View key={item.course_id} style={[styles.tableRow, isGeneralCourse(item) && styles.generalTableRow]}>
            <Text style={[styles.tableCell, { width: 220 }]} numberOfLines={1}>
              {item.title}
              {isGeneralCourse(item) && <Text style={styles.generalIndicatorTable}> (General)</Text>}
            </Text>
            <Text style={[styles.tableCell, { width: 120 }]}>{item.course_code}</Text>
            <Text style={[styles.tableCell, { width: 180 }]} numberOfLines={1}>
              {item.specialization_name || 'No specialization'}
            </Text>
            <Text style={[styles.tableCell, { width: 140 }]} numberOfLines={1}>
              {item.school_year && item.semester ? `${item.school_year} ${item.semester}` : 'No term'}
            </Text>
            <View style={[styles.tableCell, { width: 120, flexDirection: 'row', gap: 8 }]}>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tableActionButton} onPress={() => handleDelete(item)}>
                <Ionicons name="trash" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderFormModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showEditModal ? `Edit ${getTabTitle().slice(0, -1) === 'Major' ? 'Major' : getTabTitle().slice(0, -1)}` : `Add ${getTabTitle().slice(0, -1) === 'Major' ? 'Major' : getTabTitle().slice(0, -1)}`}
            </Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {activeTab === 'programs' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Program Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name || ''}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter program name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Program Abbreviation *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.program_abbreviation || ''}
                    onChangeText={(text) => setFormData({...formData, program_abbreviation: text})}
                    placeholder="e.g., BSCS, BSIT"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Department *</Text>
                  <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <Picker
                      selectedValue={formData.department_id || ''}
                      onValueChange={(itemValue, itemIndex) => {
                        const selectedDept = departments.find(dept => dept.department_id === itemValue);
                        setFormData({
                          ...formData,
                          department_id: itemValue,
                          department_name: selectedDept ? selectedDept.name : ''
                        });
                      }}
                    >
                      <Picker.Item label="Select Department" value="" />
                      {departments.map((dept) => (
                        <Picker.Item
                          key={dept.department_id}
                          label={`${dept.name} (${dept.department_abbreviation})`}
                          value={dept.department_id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {formData.department_name && (
                    <Text style={styles.selectedDepartment}>
                      Selected: {formData.department_name}
                    </Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter program description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {activeTab === 'specializations' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Major Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name || ''}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter major name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Abbreviation *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.abbreviation || ''}
                    onChangeText={(text) => setFormData({...formData, abbreviation: text})}
                    placeholder="e.g., SE, DS"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Program *</Text>
                  <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <Picker
                      selectedValue={formData.program_id || ''}
                      onValueChange={(itemValue, itemIndex) => {
                        const selectedProg = programs.find(prog => prog.program_id === itemValue);
                        setFormData({
                          ...formData,
                          program_id: itemValue,
                          program_name: selectedProg ? selectedProg.name : ''
                        });
                      }}
                    >
                      <Picker.Item label="Select Program" value="" />
                      {programs.map((prog) => (
                        <Picker.Item
                          key={prog.program_id}
                          label={`${prog.name} (${prog.program_abbreviation})`}
                          value={prog.program_id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {formData.program_name && (
                    <Text style={styles.selectedDepartment}>
                      Selected: {formData.program_name}
                    </Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter major description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {activeTab === 'courses' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Course Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.title || ''}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                    placeholder="Enter course title"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Course Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.course_code || ''}
                    onChangeText={(text) => setFormData({...formData, course_code: text})}
                    placeholder="e.g., CS101, MATH201"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specialization *</Text>
                  <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <Picker
                      selectedValue={formData.specialization_id || ''}
                      onValueChange={(itemValue, itemIndex) => {
                        const selectedSpec = specializations.find(spec => spec.specialization_id === itemValue);
                        setFormData({
                          ...formData,
                          specialization_id: itemValue,
                          specialization_name: selectedSpec ? selectedSpec.name : ''
                        });
                      }}
                    >
                      <Picker.Item label="Select Specialization" value="" />
                      {specializations.map((spec) => (
                        <Picker.Item
                          key={spec.specialization_id}
                          label={`${spec.name} (${spec.abbreviation})`}
                          value={spec.specialization_id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {formData.specialization_name && (
                    <Text style={styles.selectedDepartment}>
                      Selected: {formData.specialization_name}
                    </Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Term *</Text>
                  <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' }}>
                    <Picker
                      selectedValue={formData.term_id || ''}
                      onValueChange={(itemValue, itemIndex) => {
                        const selectedTerm = terms.find(term => term.term_id === itemValue);
                        setFormData({
                          ...formData,
                          term_id: itemValue,
                          term_display: selectedTerm ? `${selectedTerm.school_year} ${selectedTerm.semester}` : ''
                        });
                      }}
                    >
                      <Picker.Item label="Select Term" value="" />
                      {terms.map((term) => (
                        <Picker.Item
                          key={term.term_id}
                          label={`${term.school_year} ${term.semester}${term.is_active ? ' (Active)' : ''}`}
                          value={term.term_id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {formData.term_display && (
                    <Text style={styles.selectedDepartment}>
                      Selected: {formData.term_display}
                    </Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter course description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCloseModal}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {showEditModal ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProgramChairCourseManagementHeader 
        onAdd={handleAdd} 
        showContainers={showContainers}
        setShowContainers={setShowContainers}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
      />
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('programs', 'Programs', 'school')}
        {renderTabButton('specializations', 'Majors', 'library')}
        {renderTabButton('courses', 'Courses', 'book')}
      </View>

      {/* Search and Filter Controls */}
      {showContainers && (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search programs, specializations, or courses..."
                placeholderTextColor="#9CA3AF"
                value={searchTerm}
                onChangeText={setSearchTerm}
                onSubmitEditing={onSearch}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Semester Filter for Courses */}
          {activeTab === 'courses' && (
            <View style={styles.semesterFilterContainer}>
              <Text style={styles.filterTitle}>Filter by Semester</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[styles.semesterFilterButton, semesterFilter === 'all' && styles.semesterFilterButtonActive]}
                  onPress={() => setSemesterFilter('all')}
                >
                  <Text style={[styles.semesterFilterButtonText, semesterFilter === 'all' && styles.semesterFilterButtonTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.semesterFilterButton, semesterFilter === '1st' && styles.semesterFilterButtonActive]}
                  onPress={() => setSemesterFilter('1st')}
                >
                  <Text style={[styles.semesterFilterButtonText, semesterFilter === '1st' && styles.semesterFilterButtonTextActive]}>
                    1st Semester
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.semesterFilterButton, semesterFilter === '2nd' && styles.semesterFilterButtonActive]}
                  onPress={() => setSemesterFilter('2nd')}
                >
                  <Text style={[styles.semesterFilterButtonText, semesterFilter === '2nd' && styles.semesterFilterButtonTextActive]}>
                    2nd Semester
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.semesterFilterButton, semesterFilter === 'summer' && styles.semesterFilterButtonActive]}
                  onPress={() => setSemesterFilter('summer')}
                >
                  <Text style={[styles.semesterFilterButtonText, semesterFilter === 'summer' && styles.semesterFilterButtonTextActive]}>
                    Summer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{getTabTitle()}</Text>
              <Text style={styles.sectionSubtitle}>
                Manage {getTabTitle().toLowerCase()} and their configurations
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={refreshAllData}
              disabled={loading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={loading ? "#9CA3AF" : "#DC2626"} 
              />
            </TouchableOpacity>
          </View>

        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>Loading {getTabTitle()}...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : getTabData().length === 0 && (searchTerm.trim() || (activeTab === 'courses' && semesterFilter !== 'all')) ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color="#9CA3AF" />
            <Text style={styles.noResultsTitle}>No results found</Text>
            <Text style={styles.noResultsText}>
              No {getTabTitle().toLowerCase()} match your{
                searchTerm.trim() ? ` search "${searchTerm}"` : ''
              }{
                activeTab === 'courses' && semesterFilter !== 'all' ? 
                  ` ${semesterFilter === '1st' ? '1st semester' : semesterFilter === '2nd' ? '2nd semester' : 'summer'} filter` : 
                  ''
              }
            </Text>
            <TouchableOpacity 
              style={styles.clearSearchButtonLarge}
              onPress={() => {
                setSearchTerm('');
                if (activeTab === 'courses') {
                  setSemesterFilter('all');
                }
              }}
            >
              <Text style={styles.clearSearchButtonText}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : isTableView ? (
          <View style={styles.tableViewContainer}>
            <View style={styles.scrollIndicator}>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
              <Text style={styles.scrollIndicatorText}>Scroll to see more</Text>
              <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
            </View>
            <ScrollView style={styles.tableView} horizontal={true} showsHorizontalScrollIndicator={true}>
              <View>
                {renderTableHeader()}
                {getTabData().map((item, index) => renderTableRow(item, index))}
              </View>
            </ScrollView>
          </View>
        ) : (
          getTabData().map((item) => renderCard(item))
        )}
      </ScrollView>

      {renderFormModal()}
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
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  circularAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FEF2F2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#DC2626',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Add padding at the bottom for scrolling
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  cardDepartment: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
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
    maxHeight: '100%',
    minHeight: 400,
    height: '100%',
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
  formContainer: {
    flex: 1,
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
  modalFooter: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
  },
  dropdownContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: '#DC2626',
    fontWeight: '600',
  },
  selectedDepartment: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  generalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  generalIndicator: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  countSummary: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6B7280',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  clearSearchText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  clearSearchButtonLarge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Table view styles
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
    fontStyle: 'italic',
  },
  tableView: {
    flex: 1,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 14,
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  generalTableRow: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tableCell: {
    fontSize: 13,
    color: '#353A40',
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  generalIndicatorTable: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  tableActionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Semester filter styles
  semesterFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  semesterFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  semesterFilterButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  semesterFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  semesterFilterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Search bar styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 4,
  },
  clearSearchButton: {
    padding: 4,
  },
}); 