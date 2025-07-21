import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { apiClient } from '../../../utils/api';
import { useModal } from '../../../utils/useModal';
import StaffStudentManagementHeader from '../../components/StaffStudentManagementHeader';

const TABLE_NAME = 'students';

// Debug environment variables

const initialState = {
  student_number: '',
  last_name: '',
  first_name: '',
  middle_initial: '',
  suffix: '',
  full_name: '',
  gender: '',
  contact_email: '',
};

function buildFullName({ last_name, first_name, middle_initial, suffix }) {
  let fullName = '';
  if (last_name) fullName += last_name;
  if (first_name) fullName += (fullName ? ', ' : '') + first_name;
  if (middle_initial) fullName += ` ${middle_initial}`;
  if (suffix) fullName += ` ${suffix}`;
  return fullName.trim();
}

// Add a helper to split full_name into parts
function splitFullName(fullName) {
  // Try to split: Last, First Middle Suffix
  if (!fullName) return { first_name: '', middle_initial: '', last_name: '', suffix: '' };
  let last = '', first = '', middle = '', suffix = '';
  // Split by comma for Last, First
  const [lastPart, rest] = fullName.split(',').map(s => s.trim());
  if (rest) {
    last = lastPart;
    // Split rest by space for First, Middle, Suffix
    const restParts = rest.split(' ');
    first = restParts[0] || '';
    if (restParts.length === 3) {
      middle = restParts[1] || '';
      suffix = restParts[2] || '';
    } else if (restParts.length === 2) {
      // Could be First Middle or First Suffix
      if (restParts[1].length === 1) {
        middle = restParts[1];
      } else {
        suffix = restParts[1];
      }
    }
  } else {
    // No comma, try to split by space
    const parts = fullName.split(' ');
    if (parts.length === 4) {
      last = parts[0];
      first = parts[1];
      middle = parts[2];
      suffix = parts[3];
    } else if (parts.length === 3) {
      last = parts[0];
      first = parts[1];
      middle = parts[2];
    } else if (parts.length === 2) {
      last = parts[0];
      first = parts[1];
    } else if (parts.length === 1) {
      last = parts[0];
    }
  }
  return {
    first_name: first,
    middle_initial: middle,
    last_name: last,
    suffix: suffix,
  };
}

// Helper function to generate random student data
function getRandomStudent() {
  const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Liza', 'Carlos', 'Grace'];
  const lastNames = ['Dela Cruz', 'Garcia', 'Reyes', 'Santos', 'Torres', 'Ramos', 'Mendoza', 'Flores'];
  const suffixes = ['', 'Jr.', 'Sr.', 'III'];
  const genders = ['male', 'female', 'other']; // Fixed to match Picker options
  const middleInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const random = arr => arr[Math.floor(Math.random() * arr.length)];
  const randomNumber = () => Math.floor(100000 + Math.random() * 900000);
  const randomSixDigits = () => String(Math.floor(100000 + Math.random() * 900000));
  const randomSRCode = () => `22-${randomSixDigits()}`;
  const randomDate = () => {
    const start = new Date(1995, 0, 1);
    const end = new Date(2005, 11, 31);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  };

  const first_name = random(firstNames);
  const last_name = random(lastNames);
  const middle_initial = random(middleInitials);
  const suffix = random(suffixes);
  const gender = random(genders);
  const birth_date = randomDate();
  const student_number = randomSRCode();
  const contact_email = `${first_name.toLowerCase()}.${last_name.toLowerCase()}${randomNumber()}@example.com`;
  const student_photo = null;

  return {
    student_number,
    first_name,
    middle_initial,
    last_name,
    suffix,
    full_name: buildFullName({ last_name, first_name, middle_initial, suffix }),
    gender,
    birth_date,
    contact_email,
    student_photo,
  };
}

export default function StudentManagement() {
  const { shouldOpenModal } = useLocalSearchParams();
  const [student, setStudent] = useState(initialState);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const ITEMS_PER_PAGE = 20; // Limit to 20 students per page
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  // Add validation warning state
  const [showGenderWarning, setShowGenderWarning] = useState(false);
  const { visible: viewModalVisible, selectedItem: selectedStudent, openModal: openViewModal, closeModal: closeViewModal } = useModal();

  // Enable LayoutAnimation on Android
  useEffect(() => {
    // Suppress warning if setLayoutAnimationEnabledExperimental is a no-op in the new architecture
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      try {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      } catch (e) {
        // Ignore: This is a no-op in the new architecture
      }
    }
  }, []);

  useEffect(() => {
    // Only fetch students on mount, skip connection test
    fetchStudents();
    
    // Auto-open modal if shouldOpenModal parameter is present
    if (shouldOpenModal === 'true') {
      openModal();
    }
  }, []);

  const testConnection = async () => {
    try {
      // Test if we can list records (even if empty)
      const testResponse = await apiClient.get(`/collections/${TABLE_NAME}?limit=1`);
    } catch (error) {
    }
  };

  const fetchStudents = async (page = 1, append = false) => {
    setLoading(true);
    
    try {
      // Use API with pagination
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const response = await apiClient.get(`/collections/${TABLE_NAME}?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
      
      if (response.documents) {
        
        if (append) {
          setStudents(prev => [...prev, ...response.documents]);
        } else {
          setStudents(response.documents);
        }
        
        setTotalStudents(response.total || 0);
        setHasMore(response.documents.length === ITEMS_PER_PAGE);
        setCurrentPage(page);
      } else {
        if (!append) {
          setStudents([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch students from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    const updatedStudent = { ...student, [name]: value };
    setStudent(updatedStudent);
    
    // Clear gender warning when gender is selected
    if (name === 'gender' && (value && value !== 'select')) {
      setShowGenderWarning(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // Removed birth date logic
  };

  const validateFields = () => {
    // Check required fields
    if (!student.first_name?.trim()) {
      Alert.alert('Validation Error', 'First name is required.');
      return false;
    }
    
    if (!student.last_name?.trim()) {
      Alert.alert('Validation Error', 'Last name is required.');
      return false;
    }
    
    if (!student.student_number?.trim()) {
      Alert.alert('Validation Error', 'SR-Code is required.');
      return false;
    }
    
    // Gender validation - show visual warning instead of Alert
    if (!student.gender || student.gender === '' || student.gender === 'select') {
      setShowGenderWarning(true);
      return false;
    }
    
    if (!student.contact_email?.trim()) {
      Alert.alert('Validation Error', 'Email address is required.');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(student.contact_email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }
    
    // SR-Code validation - only allow numbers and hyphens
    const srCodeRegex = /^[0-9-]+$/;
    if (!srCodeRegex.test(student.student_number.trim())) {
      Alert.alert('Validation Error', 'SR-Code can only contain numbers and hyphens.');
      return false;
    }
    
    // Name length validation
    if (student.first_name.trim().length < 2) {
      Alert.alert('Validation Error', 'First name must be at least 2 characters long.');
      return false;
    }
    
    if (student.last_name.trim().length < 2) {
      Alert.alert('Validation Error', 'Last name must be at least 2 characters long.');
      return false;
    }
    
    return true;
  };

  // Check if form is valid for submit button state
  const isFormValid = () => {
    return student.first_name?.trim() && 
           student.last_name?.trim() && 
           student.student_number?.trim() && 
           student.gender && 
           student.gender !== '' && 
           student.gender !== 'select' &&
           student.contact_email?.trim();
  };

  const handleSubmit = async () => {
    // First, validate all fields including gender
    if (!validateFields()) {
      return; // Stop here if validation fails
    }
    
    // Additional validation before sending to backend
    if (!student.gender || student.gender === '' || student.gender === 'select') {
      setShowGenderWarning(true);
      return;
    }
    
    // Validate that all required fields have content
    if (!student.first_name?.trim() || !student.last_name?.trim() || 
        !student.student_number?.trim() || !student.contact_email?.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare payload for PostgreSQL
      const studentToSave = {
        student_number: student.student_number.trim(),
        full_name: buildFullName(student),
        gender: student.gender.toLowerCase(),
        contact_email: student.contact_email.trim(),
        student_photo: student.student_photo || null,
      };
      
      if (editMode && editingStudentId) {
        // Edit mode: update student (send only updatable fields)
        await apiClient.put(`/collections/${TABLE_NAME}/documents/${editingStudentId}`, studentToSave);
        setModalVisible(false);
        setEditMode(false);
        setEditingStudentId(null);
        setStudent(initialState);
        setShowGenderWarning(false);
        Alert.alert('Success', 'Student updated successfully!');
        fetchStudents();
      } else {
        // Add mode: add new student (do NOT send student_id or created_at)
        await apiClient.post(`/collections/${TABLE_NAME}/documents`, studentToSave);
        setStudent(initialState);
        setShowGenderWarning(false);
        Alert.alert('Success', 'Student added successfully!');
        setModalVisible(false);
        fetchStudents();
      }
    } catch (err) {
      console.error('Student operation error:', err);
      
      let errorMessage = 'An unexpected error occurred.';
      
      if (err.response?.status === 409) {
        errorMessage = 'A student with this SR-Code already exists.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your input.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Student not found.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert(
        editMode ? 'Update Failed' : 'Add Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (studentObj) => {
    // If the student object is missing name parts but has full_name, split it
    let patched = { ...studentObj };
    if ((!studentObj.first_name || !studentObj.last_name) && studentObj.full_name) {
      const parts = splitFullName(studentObj.full_name);
      patched = { ...patched, ...parts };
    }
    setStudent(patched);
    setEditMode(true);
    setEditingStudentId(studentObj.student_id);
    setModalVisible(true);
  };

  const handleDelete = (studentId) => {
    Alert.alert(
      'Delete Student',
      'Are you sure you want to delete this student? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await apiClient.delete(`/collections/${TABLE_NAME}/documents/${studentId}`);
              Alert.alert('Success', 'Student deleted successfully!');
              fetchStudents();
            } catch (err) {
              console.error('Delete student error:', err);
              
              let errorMessage = 'Failed to delete student.';
              
              if (err.response?.status === 404) {
                errorMessage = 'Student not found.';
              } else if (err.response?.status === 403) {
                errorMessage = 'You do not have permission to delete this student.';
              } else if (err.message) {
                errorMessage = err.message;
              }
              
              Alert.alert('Delete Failed', errorMessage, [{ text: 'OK' }]);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openModal = () => {
    setModalVisible(true);
    setEditMode(false);
    setEditingStudentId(null);
    setStudent(initialState);
    setShowGenderWarning(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditMode(false);
    setEditingStudentId(null);
    setStudent(initialState);
    setShowGenderWarning(false);
  };

  // Optimized search with debouncing
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const performSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use API to get all students and filter client-side for now
      const response = await apiClient.get(`/collections/${TABLE_NAME}?limit=100`);
      
      // Filter results client-side
      const filtered = (response.documents || []).filter(student => 
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filtered);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (text) => {
    setSearch(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(text);
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  // Use search results if searching, otherwise use paginated students
  const filteredStudents = search.trim() ? searchResults : students;

  // Student card press handler with animation
  const handleCardPress = (studentId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  const handleAddImage = (studentId) => {
    Alert.alert(
      'Add Student Photo',
      'This feature will be available when image upload functionality is integrated with the database.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  // Pagination functions
  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    fetchStudents(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchStudents(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      fetchStudents(currentPage + 1);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={handlePreviousPage}
          disabled={currentPage === 1}
        >
          <Ionicons name="arrow-back" size={20} color={currentPage === 1 ? "#9CA3AF" : "#DC2626"} />
        </TouchableOpacity>

        <View style={styles.paginationNumbers}>
          {getVisiblePages().map((page, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationNumber,
                page === currentPage && styles.paginationNumberActive,
                page === '...' && styles.paginationDots
              ]}
              onPress={() => page !== '...' && handlePageChange(page)}
              disabled={page === '...'}
            >
              <Text style={[
                styles.paginationNumberText,
                page === currentPage && styles.paginationNumberTextActive
              ]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="arrow-forward" size={20} color={currentPage === totalPages ? "#9CA3AF" : "#DC2626"} />
        </TouchableOpacity>
      </View>
    );
  };

  // Load more students for pagination
  const loadMoreStudents = () => {
    if (hasMore && !loading && !search.trim()) {
      fetchStudents(currentPage + 1, true);
    }
  };

  const fillRandomStudent = () => {
    const randomStudent = getRandomStudent();
    setStudent(randomStudent);
    setShowGenderWarning(false); // Clear gender warning since random data includes valid gender
  };

  // Check if form is complete for submission
  const isFormComplete = () => {
    return student.first_name?.trim() && 
           student.last_name?.trim() && 
           student.student_number?.trim() && 
           student.contact_email?.trim() && 
           student.gender && 
           student.gender !== '' && 
           student.gender !== 'select';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StaffStudentManagementHeader
        search={search}
        setSearch={handleSearchChange}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        onAddStudent={openModal}
      />
      
      {/* Student List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={32} color="#DC2626" style={{ marginBottom: 12 }} />
            <Text style={styles.loadingText}>
              {isSearching ? 'Searching...' : 'Loading students...'}
            </Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>
              {search.length > 0 ? 'No students found' : 'No students yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {search.length > 0 
                ? 'Try adjusting your search terms' 
                : 'Add your first student to get started'
              }
            </Text>
            {search.length === 0 && (
              <TouchableOpacity style={styles.emptyAddButton} onPress={openModal}>
                <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.emptyAddButtonText}>Add First Student</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isTableView ? (
          <ScrollView style={styles.tableViewContainer} showsVerticalScrollIndicator={false}>
            {/* Table Header */}
            <ScrollView style={styles.tableView} horizontal={true} showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, {width: 140}]}>SR-Code</Text>
                  <Text style={[styles.tableHeaderCell, {width: 220}]}>Full Name</Text>
                  <Text style={[styles.tableHeaderCell, {width: 120}]}>Gender</Text>
                  <Text style={[styles.tableHeaderCell, {width: 320}]}>Email</Text>
                </View>
                {filteredStudents.map((s, idx) => (
                  <View key={s.student_id || idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, {width: 140}]}>{s.student_number}</Text>
                    <Text style={[styles.tableCell, {width: 220}]}>{s.full_name}</Text>
                    <Text style={[styles.tableCell, {width: 120}]}>{s.gender}</Text>
                    <Text style={[styles.tableCell, {width: 320}]} numberOfLines={1}>{s.contact_email}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            {!search.trim() && renderPagination()}
          </ScrollView>
        ) : (
          <ScrollView style={styles.studentList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentListContainer}>
            {filteredStudents.map((s, idx) => (
              <ClickableContainer
                key={s.student_id || idx}
                style={styles.studentCard}
                onPress={() => openViewModal(s)}
              >
                <View style={styles.studentHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {s.full_name ? s.full_name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{s.full_name}</Text>
                    <Text style={styles.studentNumber}>{s.student_number}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </View>
              </ClickableContainer>
            ))}
            {/* Load More Button */}
            {hasMore && !search.trim() && (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={loadMoreStudents}
                disabled={loading}
              >
                <Text style={styles.loadMoreButtonText}>
                  {loading ? 'Loading...' : 'Load More Students'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      {/* Add Student Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addEditModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons 
                  name={editMode ? "create-outline" : "person-add-outline"} 
                  size={24} 
                  color="#DC2626" 
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalTitle}>{editMode ? 'Edit Student' : 'Add New Student'}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={{marginBottom: 16, alignSelf: 'flex-end', backgroundColor: '#F59E42', padding: 8, borderRadius: 8}} onPress={fillRandomStudent}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Fill Random Data</Text>
              </TouchableOpacity>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SR-Code</Text>
                <TextInput
                  style={styles.input}
                  value={student.student_number}
                  onChangeText={value => handleChange('student_number', value)}
                  placeholder="Enter student number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={student.first_name}
                  onChangeText={value => handleChange('first_name', value)}
                  placeholder="Enter first name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Middle Initial</Text>
                <TextInput
                  style={styles.input}
                  value={student.middle_initial}
                  onChangeText={value => handleChange('middle_initial', value)}
                  placeholder="Enter middle initial"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={student.last_name}
                  onChangeText={value => handleChange('last_name', value)}
                  placeholder="Enter last name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Suffix</Text>
                <TextInput
                  style={styles.input}
                  value={student.suffix}
                  onChangeText={value => handleChange('suffix', value)}
                  placeholder="Enter suffix (e.g., Jr., Sr.)"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={student.gender || 'select'}
                    onValueChange={value => handleChange('gender', value === 'select' ? '' : value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select gender" value="select" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
                {showGenderWarning && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning-outline" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                    <Text style={styles.warningText}>Please select a gender</Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Email *</Text>
                <TextInput
                  style={styles.input}
                  value={student.contact_email}
                  onChangeText={value => handleChange('contact_email', value)}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.submitButton, 
                    (!isFormComplete() || loading) && styles.submitButtonDisabled
                  ]} 
                  onPress={handleSubmit} 
                  disabled={!isFormComplete() || loading}
                >
                  {loading ? (
                    <View style={styles.loadingButtonContent}>
                      <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>
                        {editMode ? 'Saving...' : 'Adding...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons 
                        name={editMode ? "checkmark-outline" : "add-outline"} 
                        size={16} 
                        color="#FFFFFF" 
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[
                        styles.submitButtonText,
                        !isFormComplete() && styles.submitButtonTextDisabled
                      ]}>
                        {editMode ? 'Save Changes' : 'Add Student'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Show completion status */}
              {!isFormComplete() && (
                <View style={styles.completionStatus}>
                  <Ionicons name="information-circle-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={styles.completionStatusText}>
                    Please complete all required fields to continue
                  </Text>
                </View>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student View Modal */}
      {selectedStudent && (
        <ModalContainer
          visible={viewModalVisible}
          onClose={closeViewModal}
          title="Student Details"
          footer={
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalEditButton]}
                onPress={() => {
                  closeViewModal();
                  handleEdit(selectedStudent);
                }}
              >
                <Ionicons name="create-outline" size={16} color="#F59E42" />
                <Text style={styles.modalEditButtonText}>Edit Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalDeleteButton]}
                onPress={() => {
                  closeViewModal();
                  handleDelete(selectedStudent.student_id);
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.modalDeleteButtonText}>Delete Student</Text>
              </TouchableOpacity>
            </View>
          }
        >
          <View style={styles.modalContent}>
            {/* Student Header */}
            <View style={styles.modalStudentHeader}>
              <View style={styles.modalStudentAvatar}>
                <Text style={styles.modalStudentAvatarText}>
                  {selectedStudent.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : 'S'}
                </Text>
              </View>
              <View style={styles.modalStudentInfo}>
                <Text style={styles.modalStudentName}>{selectedStudent.full_name}</Text>
                <Text style={styles.modalStudentNumber}>{selectedStudent.student_number}</Text>
              </View>
            </View>

            {/* Add Image Button */}
            <View style={styles.modalImageSection}>
              <TouchableOpacity style={styles.addImageButton} onPress={() => handleAddImage(selectedStudent.student_id)}>
                <Ionicons name="camera-outline" size={20} color="#DC2626" />
                <Text style={styles.addImageButtonText}>Add Student Photo</Text>
              </TouchableOpacity>
              <Text style={styles.imagePlaceholderText}>Photo placeholder for future database integration</Text>
            </View>

            {/* Student Details */}
            <View style={styles.modalStudentDetails}>
              <View style={styles.modalDetailRow}>
                <View style={styles.modalDetailItem}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDetailLabel}>Gender:</Text>
                  <Text style={styles.modalDetailValue}>{selectedStudent.gender}</Text>
                </View>
              </View>
              <View style={styles.modalDetailRow}>
                <View style={styles.modalDetailItem}>
                  <Ionicons name="mail-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={styles.modalDetailLabel}>Email:</Text>
                  <Text style={styles.modalDetailValue}>{selectedStudent.contact_email}</Text>
                </View>
              </View>
              {selectedStudent.birth_date && (
                <View style={styles.modalDetailRow}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.modalDetailLabel}>Birth Date:</Text>
                    <Text style={styles.modalDetailValue}>{selectedStudent.birth_date}</Text>
                  </View>
                </View>
              )}
              {selectedStudent.middle_initial && (
                <View style={styles.modalDetailRow}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="person-circle-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.modalDetailLabel}>Middle Initial:</Text>
                    <Text style={styles.modalDetailValue}>{selectedStudent.middle_initial}</Text>
                  </View>
                </View>
              )}
              {selectedStudent.suffix && (
                <View style={styles.modalDetailRow}>
                  <View style={styles.modalDetailItem}>
                    <Ionicons name="person-circle-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.modalDetailLabel}>Suffix:</Text>
                    <Text style={styles.modalDetailValue}>{selectedStudent.suffix}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ModalContainer>
      )}
    </View>
  );
}

// Update styles for color and design consistency
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DC2626',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FECACA',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  statsContainer: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentList: {
    flex: 1,
  },
  studentListContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 2,
  },
  studentNumber: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEditModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#353A40',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#353A40',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF', // Gray out text when disabled
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#F59E42',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#353A40',
    marginBottom: 12,
  },
  clearSearchButton: {
    padding: 8,
  },
  studentDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '500',
  },
  listHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonSmall: {
    backgroundColor: '#DC2626',
    marginLeft: 10,
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadMoreButtonText: {
    color: '#353A40',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  addButtonSimple: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnlyButton: {
    backgroundColor: 'transparent',
    padding: 4,
    marginLeft: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchViewButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableView: {
    flex: 1,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14, // increased vertical padding
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 16,
    paddingHorizontal: 16, // increased horizontal padding
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // increased vertical padding
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 48, // ensure minimum row height
  },
  tableCell: {
    flex: 1,
    fontSize: 15,
    color: '#353A40',
    paddingHorizontal: 16, // increased horizontal padding
    textAlign: 'left',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
  },
  completionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  completionStatusText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  circleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  // Modal Styles
  modalContent: {
    padding: 16,
  },
  modalStudentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalStudentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalStudentAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalStudentInfo: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  modalStudentNumber: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalStudentDetails: {
    marginBottom: 20,
  },
  modalDetailRow: {
    marginBottom: 12,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    width: 100,
    marginLeft: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
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
  modalEditButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E42',
  },
  modalDeleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  modalEditButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E42',
  },
  modalDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalImageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E42',
    marginBottom: 8,
  },
  addImageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E42',
    marginLeft: 8,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Pagination Styles (matching admin user management)
  tableViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationNumberActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  paginationDots: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  paginationNumberText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  paginationNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 