import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, LayoutAnimation, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { apiClient, getAPIBaseURL, initializeAPI } from '../../../utils/api';
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
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  // Add validation warning state
  const [showGenderWarning, setShowGenderWarning] = useState(false);
  const { visible: viewModalVisible, selectedItem: selectedStudent, openModal: openViewModal, closeModal: closeViewModal } = useModal();
  const [studentPhoto, setStudentPhoto] = useState(null);


  useEffect(() => {
    // Only fetch students on mount, skip connection test
    fetchStudents();
    
    // Auto-open modal if shouldOpenModal parameter is present
    if (shouldOpenModal === 'true') {
      openModal();
    }
  }, []);

  // Refetch students when view mode changes
  useEffect(() => {
    if (students.length > 0) {
      fetchStudents();
    }
  }, [isTableView]);

  const testConnection = async () => {
    try {
      // Test if we can list records (even if empty)
      const testResponse = await apiClient.get(`/collections/${TABLE_NAME}?limit=1`);
    } catch (error) {
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Load all students at once without pagination
      const response = await apiClient.get(`/collections/${TABLE_NAME}`);
      
      if (response.documents) {
        // Sort students by last name (surname)
        const sortedStudents = response.documents.sort((a, b) => {
          const getLastName = (fullName) => {
            if (!fullName) return '';
            const parts = fullName.split(',');
            return parts[0] ? parts[0].trim() : fullName.trim();
          };
          const lastNameA = getLastName(a.full_name);
          const lastNameB = getLastName(b.full_name);
          return lastNameA.localeCompare(lastNameB, 'en', { sensitivity: 'base' });
        });
        setStudents(sortedStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
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
      if (editMode && editingStudentId) {
        // Edit mode: update student (send only updatable fields)
      const studentToSave = {
        student_number: student.student_number.trim(),
        full_name: buildFullName(student),
        gender: student.gender.toLowerCase(),
        contact_email: student.contact_email.trim(),
        student_photo: student.student_photo || null,
      };
        await apiClient.put(`/collections/${TABLE_NAME}/documents/${editingStudentId}`, studentToSave);
        setModalVisible(false);
        setEditMode(false);
        setEditingStudentId(null);
        setStudent(initialState);
        setShowGenderWarning(false);
        Alert.alert('Success', 'Student updated successfully!');
        fetchStudents();
      } else {
        // Add mode: add new student (with photo upload)
        const formData = new FormData();
        formData.append('student_number', student.student_number.trim());
        formData.append('first_name', student.first_name.trim());
        formData.append('middle_initial', student.middle_initial || '');
        formData.append('last_name', student.last_name.trim());
        formData.append('suffix', student.suffix || '');
        formData.append('gender', student.gender.toLowerCase());
        formData.append('contact_email', student.contact_email.trim());
        if (studentPhoto) {
          const uriParts = studentPhoto.split('.');
          const fileType = uriParts[uriParts.length - 1];
          formData.append('photo', {
            uri: studentPhoto,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          });
        }
        const response = await fetch(`${getAPIBaseURL()}/students`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          let errorMessage = 'Failed to add student';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorMessage = `Server error (${response.status})`;
          }
          throw new Error(errorMessage);
        }
        
        // Try to parse the success response
        let responseData;
        try {
          responseData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse success response:', parseError);
          throw new Error('Server returned invalid response');
        }
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
      
      // Sort filtered results by last name
      const sortedFiltered = filtered.sort((a, b) => {
        // Extract last name from full_name
        const getLastName = (fullName) => {
          if (!fullName) return '';
          // Split by comma and take the first part (Last, First format)
          const parts = fullName.split(',');
          return parts[0] ? parts[0].trim() : fullName.trim();
        };
        
        const lastNameA = getLastName(a.full_name);
        const lastNameB = getLastName(b.full_name);
        
        return lastNameA.localeCompare(lastNameB, 'en', { sensitivity: 'base' });
      });
      
      setSearchResults(sortedFiltered);
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

  const handleAddImage = async (studentId) => {
    try {
      console.log('Starting image picker for student:', studentId);
      
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access media library is required to select a photo.');
        return;
      }
      
      console.log('Launching image picker...');
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        await updateStudentPhoto(studentId, result.assets[0].uri);
      } else {
        console.log('No image selected or picker was canceled');
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', `Could not open image picker: ${err.message}`);
    }
  };

  const refreshNetworkConnection = async () => {
    try {
      console.log('🔄 Refreshing network connection...');
      
      // Re-initialize API configuration
      await initializeAPI();
      
      // Test the connection
      const testResponse = await fetch(`${getAPIBaseURL()}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (testResponse.ok) {
        console.log('✅ Network connection refreshed successfully');
        return true;
      } else {
        console.log('⚠️ Network test failed, but continuing...');
        return false;
      }
    } catch (error) {
      console.error('❌ Network refresh error:', error);
      return false;
    }
  };

  const updateStudentPhoto = async (studentId, photoUri) => {
    // Validation 1: Check if photoUri exists
    if (!photoUri) {
      Alert.alert('Validation Error', 'No photo selected.');
      return;
    }
    
    // Validation 2: Check file type
    const uriParts = photoUri.split('.');
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!allowedTypes.includes(fileType)) {
      Alert.alert('Validation Error', 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.');
      return;
    }
    
    // Validation 3: Check file size (get file info)
    try {
      const fileInfo = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', photoUri);
        xhr.onload = () => {
          const contentLength = xhr.getResponseHeader('Content-Length');
          resolve({ size: parseInt(contentLength) || 0 });
        };
        xhr.onerror = reject;
        xhr.send();
      });
      
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      if (fileInfo.size > maxSize) {
        Alert.alert('Validation Error', 'File size too large. Please select an image smaller than 5MB.');
        return;
      }
    } catch (sizeError) {
      console.log('Could not check file size, proceeding with upload:', sizeError);
    }
    
    // Validation 4: Check if image is valid (simplified for React Native)
    // Note: React Native doesn't support new Image() like web browsers
    // We'll rely on the file type validation and let the server handle image validation
    console.log('✅ Image validation passed (file type and size checks completed)');
    
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempt ${retryCount + 1} of ${maxRetries} - Updating student photo for ID: ${studentId}`);
        
        // Refresh network connection before each attempt
        if (retryCount > 0) {
          console.log('🔄 Retrying - Refreshing network connection...');
          await refreshNetworkConnection();
          // Wait longer between retries to let server recover
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Add delay between uploads to prevent server overload
        if (retryCount === 0) {
          console.log('⏳ Adding delay to prevent server overload...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      
      // Show loading indicator
      Alert.alert('Uploading...', 'Please wait while the photo is being uploaded.', [], { cancelable: false });
      
      // Create FormData for the photo upload
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
      
      // Test server connection first
      console.log('🔍 Testing server connection...');
      try {
        const testResponse = await fetch(`${getAPIBaseURL()}/health`, {
          method: 'GET',
          timeout: 5000,
        });
        if (!testResponse.ok) {
          throw new Error('Server health check failed');
        }
        console.log('✅ Server connection test passed');
      } catch (testError) {
        console.error('❌ Server connection test failed:', testError);
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      
      // Send the photo to the server
      console.log('📤 Sending photo to server...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${getAPIBaseURL()}/students/${studentId}/photo`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to update student photo';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Photo updated successfully:', responseData);
      
      // Reset connection and wait after successful upload
      console.log('🔄 Resetting connection after successful upload...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
      
      const networkRefreshed = await refreshNetworkConnection();
      
      if (networkRefreshed) {
        console.log('✅ Network refreshed, fetching updated student list...');
      } else {
        console.log('⚠️ Network refresh failed, but continuing with student list update...');
      }
      
      // Refresh the student list to show the updated photo
      console.log('🔄 Refreshing student list...');
      try {
        await fetchStudents();
        console.log('✅ Student list refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Failed to refresh student list:', refreshError);
        // Try one more time after a short delay
        setTimeout(async () => {
          try {
            await fetchStudents();
            console.log('✅ Student list refreshed on second attempt');
          } catch (secondError) {
            console.error('❌ Second refresh attempt also failed:', secondError);
          }
        }, 1000);
      }
      
      // Close the modal if it's open
      if (viewModalVisible) {
        closeViewModal();
      }
      
      // Show success message with option to refresh manually
    Alert.alert(
        'Success', 
        'Student photo updated successfully! The list has been refreshed.',
        [
          {
            text: 'Refresh List',
            onPress: async () => {
              try {
                await fetchStudents();
                console.log('✅ Manual refresh completed');
              } catch (error) {
                console.error('❌ Manual refresh failed:', error);
              }
            }
          },
        { text: 'OK', style: 'default' }
      ]
    );
        return; // Success, exit the retry loop
        
      } catch (err) {
        retryCount++;
        console.error(`❌ Attempt ${retryCount} failed:`, err);
        
        let errorMessage = err.message;
        if (err.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        }
        
        if (retryCount >= maxRetries) {
          console.error('❌ All retry attempts failed');
          Alert.alert('Error', `Failed to update student photo after ${maxRetries} attempts: ${errorMessage}`);
          return;
        } else {
          console.log(`🔄 Retrying... (${retryCount}/${maxRetries})`);
          continue; // Try again
        }
      }
    }
  };

  const pickStudentPhoto = async () => {
    try {
      console.log('Starting image picker...');
      
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access media library is required to select a photo.');
        return;
      }
      
      console.log('Launching image picker...');
      let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected:', result.assets[0].uri);
        setStudentPhoto(result.assets[0].uri);
      } else {
        console.log('No image selected or picker was canceled');
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', `Could not open image picker: ${err.message}`);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      console.log('Starting camera...');
      
      // Request camera permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera is required to take a photo.');
        return;
      }
      
      console.log('Launching camera...');
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });
      
      console.log('Camera result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Photo taken:', result.assets[0].uri);
        setStudentPhoto(result.assets[0].uri);
      } else {
        console.log('No photo taken or camera was canceled');
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', `Could not open camera: ${err.message}`);
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
          <ScrollView 
            style={styles.tableViewOuterContainer}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.tableViewContainer}>
              <View style={styles.scrollIndicator}>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                <Text style={styles.scrollIndicatorText}>Scroll to see more</Text>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
              </View>
              <ScrollView 
                style={styles.tableView} 
                horizontal={true} 
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.tableContentContainer}
              >
                <View style={styles.tableWrapper}>
                  {/* Sticky Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, {width: 60}]}>#</Text>
                    <Text style={[styles.tableHeaderCell, {width: 140}]}>SR-Code</Text>
                    <Text style={[styles.tableHeaderCell, {width: 220}]}>Full Name</Text>
                    <Text style={[styles.tableHeaderCell, {width: 120}]}>Gender</Text>
                    <Text style={[styles.tableHeaderCell, {width: 320}]}>Email</Text>
                  </View>
                  {/* Scrollable Rows */}
                  <ScrollView style={{maxHeight: 500}} showsVerticalScrollIndicator={true}>
                    {filteredStudents.map((s, idx) => (
                      <View key={s.student_id || idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, {width: 60}]}>{idx + 1}</Text>
                        <Text style={[styles.tableCell, {width: 140}]}>{s.student_number}</Text>
                        <Text style={[styles.tableCell, {width: 220}]}>{s.full_name}</Text>
                        <Text style={[styles.tableCell, {width: 120}]}>{s.gender}</Text>
                        <Text style={[styles.tableCell, {width: 320}]} numberOfLines={1}>{s.contact_email}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.studentList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentListContainer}>
            {filteredStudents.map((s, idx) => (
              <ClickableContainer
                key={s.student_id || idx}
                style={styles.studentCard}
                onPress={() => openViewModal(s)}
              >
                <View style={styles.studentHeaderSimple}>
                  <View style={styles.studentPhotoContainer}>
                    {s.student_photo ? (
                      <Image 
                        source={{ uri: `${getAPIBaseURL().replace('/api', '')}${s.student_photo}` }} 
                        style={styles.studentPhoto}
                        onError={(error) => console.log('Image load error:', error)}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Ionicons name="person" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{s.full_name}</Text>
                    <Text style={styles.studentNumber}>{s.student_number}</Text>
                  </View>
                </View>
              </ClickableContainer>
            ))}
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
                <Text style={styles.modalTitle}>{editMode ? 'Edit Student' : 'Add New Student'}</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.photoPickerContainer}>
                <Text style={styles.photoPickerLabel}>Student Photo (optional)</Text>
                <View style={styles.photoPickerButtons}>
                  <TouchableOpacity style={styles.photoPickerButton} onPress={pickStudentPhoto}>
                    <Ionicons name="images-outline" size={16} color="#475569" />
                    <Text style={styles.photoPickerButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
                  <TouchableOpacity style={styles.photoPickerButton} onPress={takePhotoWithCamera}>
                    <Ionicons name="camera-outline" size={16} color="#475569" />
                    <Text style={styles.photoPickerButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
                {studentPhoto && (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: studentPhoto }} style={styles.photoPreview} />
                    <TouchableOpacity style={styles.removePhotoButton} onPress={() => setStudentPhoto(null)}>
                      <Ionicons name="close-circle" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.fillRandomButton} onPress={fillRandomStudent}>
                <Ionicons name="shuffle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.fillRandomButtonText}>Fill Random Data</Text>
              </TouchableOpacity>
              <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 16}} showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
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
                </View>
              </ScrollView>
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
                      <Text style={styles.submitButtonText}>
                        {editMode ? 'Save Changes' : 'Add Student'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
                </View>
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

            {/* Photo Section */}
            <View style={styles.modalImageSection}>
              {selectedStudent.student_photo ? (
                <View style={styles.modalPhotoContainer}>
                  <Image 
                    source={{ uri: `${getAPIBaseURL().replace('/api', '')}${selectedStudent.student_photo}` }} 
                    style={styles.modalLargePhoto}
                    onError={(error) => console.log('Modal large image load error:', error)}
                  />
                  <TouchableOpacity style={styles.changePhotoButton} onPress={() => handleAddImage(selectedStudent.student_id)}>
                    <Ionicons name="camera-outline" size={16} color="#475569" />
                    <Text style={styles.changePhotoButtonText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.modalNoPhotoContainer}>
                  <View style={styles.modalNoPhotoPlaceholder}>
                    <Ionicons name="person" size={48} color="#D1D5DB" />
                  </View>
              <TouchableOpacity style={styles.addImageButton} onPress={() => handleAddImage(selectedStudent.student_id)}>
                <Ionicons name="camera-outline" size={20} color="#DC2626" />
                <Text style={styles.addImageButtonText}>Add Student Photo</Text>
              </TouchableOpacity>
                </View>
              )}
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
    maxHeight: '95%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'column',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 48,
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
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF', // Gray out text when disabled
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tableCell: {
    fontSize: 13,
    color: '#353A40',
    paddingHorizontal: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
  },
  completionStatusText: {
    fontSize: 14,
    color: '#3B82F6',
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
  // Table view styles
  tableViewContainer: {
    backgroundColor: '#FFFFFF',
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
  tableContentContainer: {
    paddingHorizontal: 16, // Add horizontal padding to the content container
  },
  tableWrapper: {
    // This wrapper is needed to contain the horizontally scrollable content
    // and ensure proper layout of the header and rows.
    // It's not directly used for styling, but for structure.
  },
  tableBodyScroll: {
    maxHeight: 400, // Set a maximum height for the table body
    flex: 1,
  },
  studentHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
    marginBottom: 0,
  },
  studentPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: 'hidden',
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableViewOuterContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 600, // Increased height to show more students
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 48,
  },
  fillRandomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  fillRandomButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  photoPickerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  photoPickerButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
  photoPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  modalStudentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalLargePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modalPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalNoPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalNoPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 6,
  },
  changePhotoButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
}); 