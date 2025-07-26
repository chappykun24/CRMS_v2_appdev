import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import apiClient, { getAPIBaseURL } from '../../utils/api';

export default function FacultySignupScreen() {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleInitial: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    termStart: '',
    termEnd: '',
    profileType: 'faculty', // hidden
    profilePic: null, // placeholder for file upload
  });
  const [facultyPhoto, setFacultyPhoto] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermStartPicker, setShowTermStartPicker] = useState(false);
  const [showTermEndPicker, setShowTermEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Photo picker functions
  const pickFacultyPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFacultyPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo. Please try again.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFacultyPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  useEffect(() => {
    // Fetch departments from backend
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get('/collections/departments');
        if (res && res.documents) {
          setDepartments(res.documents);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    // Validate required fields
    if (!formData.lastName || !formData.firstName || !formData.email || !formData.password || !formData.confirmPassword || !formData.department) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // Hash the password (SHA-256)
      const password_hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        formData.password
      );

      // Combine name fields
      const name = [formData.firstName, formData.middleInitial, formData.lastName, formData.suffix].filter(Boolean).join(' ');

      // Prepare user data for backend
      const userData = {
        name,
        email: formData.email,
        password_hash,
        role_id: 5, // Faculty role_id
        is_approved: false,
        profile_pic: null,
      };

      // If photo is selected, upload it first
      let photoPath = null;
      if (facultyPhoto) {
        try {
          const formData = new FormData();
          const uriParts = facultyPhoto.split('.');
          const fileType = uriParts[uriParts.length - 1].toLowerCase();
          
          formData.append('photo', {
            uri: facultyPhoto,
            name: `faculty_photo.${fileType}`,
            type: `image/${fileType}`,
          });

          const photoResponse = await fetch(`${getAPIBaseURL()}/users/faculty/photo`, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });

          if (photoResponse.ok) {
            const photoData = await photoResponse.json();
            photoPath = photoData.photo_path;
          } else {
            console.error('Failed to upload photo:', photoResponse.status);
          }
        } catch (photoError) {
          console.error('Error uploading photo:', photoError);
        }
      }

      // Update user data with photo path if available
      if (photoPath) {
        userData.profile_pic = photoPath;
      }

      // Send to backend
      const response = await apiClient.post('/collections/users/documents', userData);

      if (response && response.user_id) {
        // Save department_id and other profile info in user_profiles
        try {
          await apiClient.post('/collections/user_profiles/documents', {
            user_id: response.user_id,
            department_id: parseInt(formData.department, 10),
            profile_type: 'faculty',
            term_start: formData.termStart || null,
            term_end: formData.termEnd || null,
            // Add more fields as needed
          });
        } catch (profileErr) {
          console.error('Error saving user profile:', profileErr);
          Alert.alert('Error', 'User was created, but failed to save profile. Please contact admin.');
          setIsSubmitting(false);
          return;
        }
        Alert.alert(
          'Registration Successful',
          'Your faculty account has been created. Please wait for admin approval.',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  lastName: '',
                  firstName: '',
                  middleInitial: '',
                  suffix: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  department: '',
                  termStart: '',
                  termEnd: '',
                  profileType: 'faculty',
                  profilePic: null,
                });
                setFacultyPhoto(null);
                router.back();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to register. Please try again.');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillRandomData = () => {
    // Sample Filipino names
    const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Liza', 'Carlos', 'Grace', 'Ramon', 'Cecilia'];
    const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Torres', 'Gonzales', 'Ramos', 'Lopez', 'Aquino'];
    const middleInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];
    const randomEmail = (first, last) => `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random()*1000)}@example.com`;
    const randomDept = departments.length > 0 ? departments[Math.floor(Math.random() * departments.length)].department_id : '';
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    // Generate random term dates
    const randomYear = () => 2020 + Math.floor(Math.random() * 5); // 2020-2024
    const pad = n => n.toString().padStart(2, '0');
    const startYear = randomYear();
    const startMonth = pad(1 + Math.floor(Math.random() * 12));
    const startDay = pad(1 + Math.floor(Math.random() * 28));
    const termStart = `${startYear}-${startMonth}-${startDay}`;
    const endYear = startYear + 1;
    const endMonth = pad(1 + Math.floor(Math.random() * 12));
    const endDay = pad(1 + Math.floor(Math.random() * 28));
    const termEnd = `${endYear}-${endMonth}-${endDay}`;
    setFormData({
      lastName,
      firstName,
      middleInitial: randomItem(middleInitials),
      email: randomEmail(firstName, lastName),
      password: 'Password123!',
      confirmPassword: 'Password123!',
      department: randomDept,
      termStart,
      termEnd,
    });
  };

  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    headerContainer: {
      backgroundColor: '#FFFFFF',
      zIndex: 200,
      paddingTop: 40,
      paddingBottom: 16,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 60,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#353A40',
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },

    formContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 40,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#353A40',
      marginBottom: 16,
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
      color: '#353A40',
    },
    pickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#F9FAFB',
    },
    pickerText: {
      fontSize: 16,
      color: '#353A40',
      flex: 1,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      backgroundColor: '#F9FAFB',
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#353A40',
    },
    passwordToggle: {
      padding: 12,
    },
    submitButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      paddingVertical: 16,
      borderRadius: 8,
      marginLeft: 12,
      opacity: 1,
    },
    submitButtonDisabled: {
      backgroundColor: '#DC2626',
      opacity: 0.5,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      marginTop: 20,
      marginBottom: 20,
    },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cancelButtonText: {
      color: '#475569',
      fontSize: 16,
      fontWeight: '600',
    },
    infoNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#F0F9FF',
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#BAE6FD',
    },
    infoText: {
      fontSize: 14,
      color: '#353A40',
      marginLeft: 8,
      flex: 1,
      lineHeight: 20,
    },
    photoContainer: {
      width: '100%',
      height: 150,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
    },
    photoPreviewContainer: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    photoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    removePhotoButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 5,
      zIndex: 1,
    },
    photoPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
    },
    photoPlaceholderText: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 10,
    },
    photoButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 12,
    },
    photoButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    photoButtonText: {
      fontSize: 14,
      color: '#475569',
      marginLeft: 8,
      fontWeight: '500',
    },
    fillRandomButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 20,
      marginBottom: 20,
    },
    fillRandomButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#dc2626" />
            </TouchableOpacity>
            <Text style={styles.title}>Faculty Registration</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Faculty Photo Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faculty Photo (Optional)</Text>
              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={pickFacultyPhoto}>
                  <Ionicons name="images-outline" size={20} color="#475569" />
                  <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={takePhotoWithCamera}>
                  <Ionicons name="camera-outline" size={20} color="#475569" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fill Random Data Button */}
            <TouchableOpacity
              style={styles.fillRandomButton}
              onPress={fillRandomData}
            >
              <Ionicons name="shuffle" size={20} color="#FFFFFF" />
              <Text style={styles.fillRandomButtonText}>Fill Random Data</Text>
            </TouchableOpacity>

            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  placeholder="Enter last name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="Enter first name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Middle Initial</Text>
                <TextInput
                  style={styles.input}
                  value={formData.middleInitial}
                  onChangeText={(text) => setFormData({ ...formData, middleInitial: text })}
                  placeholder="Enter middle initial"
                  maxLength={1}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Suffix</Text>
                <TextInput
                  style={styles.input}
                  value={formData.suffix}
                  onChangeText={(text) => setFormData({ ...formData, suffix: text })}
                  placeholder="Enter suffix (e.g., Jr., Sr.)"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            {/* Faculty Photo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Faculty Photo (Optional)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Profile Picture</Text>
                <View style={styles.photoContainer}>
                  {facultyPhoto ? (
                    <View style={styles.photoPreviewContainer}>
                      <Image source={{ uri: facultyPhoto }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setFacultyPhoto(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera" size={32} color="#9CA3AF" />
                      <Text style={styles.photoPlaceholderText}>Add a profile photo</Text>
                    </View>
                  )}
                </View>
                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={pickFacultyPhoto}
                  >
                    <Ionicons name="images-outline" size={20} color="#6B7280" />
                    <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={takePhotoWithCamera}
                  >
                    <Ionicons name="camera-outline" size={20} color="#6B7280" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* Academic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Academic Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department *</Text>
                <TouchableOpacity
                  style={styles.pickerContainer}
                  onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerText}>
                    {formData.department
                      ? `${departments.find(d => d.department_id === formData.department)?.name || ''} (${departments.find(d => d.department_id === formData.department)?.department_abbreviation || ''})`
                      : 'Select your department'}
                  </Text>
                  <Ionicons name={showDeptDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
                </TouchableOpacity>
                {showDeptDropdown && (
                  <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 4, maxHeight: 200 }}>
                    {departments.map((dept) => (
                      <TouchableOpacity
                        key={dept.department_id}
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                        onPress={() => {
                          setFormData({ ...formData, department: dept.department_id });
                          setShowDeptDropdown(false);
                        }}
                      >
                        <Text style={{ fontSize: 16, color: '#353A40' }}>{dept.name} ({dept.department_abbreviation})</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Term Start</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowTermStartPicker(true)}
                >
                  <Text style={{ color: formData.termStart ? '#353A40' : '#6B7280' }}>
                    {formData.termStart || 'YYYY-MM-DD (optional)'}
                  </Text>
                </TouchableOpacity>
                {showTermStartPicker && (
                  <DateTimePicker
                    value={formData.termStart ? new Date(formData.termStart) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowTermStartPicker(false);
                      if (selectedDate) {
                        const iso = selectedDate.toISOString().split('T')[0];
                        setFormData({ ...formData, termStart: iso });
                      }
                    }}
                  />
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Term End</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowTermEndPicker(true)}
                >
                  <Text style={{ color: formData.termEnd ? '#353A40' : '#6B7280' }}>
                    {formData.termEnd || 'YYYY-MM-DD (optional)'}
                  </Text>
                </TouchableOpacity>
                {showTermEndPicker && (
                  <DateTimePicker
                    value={formData.termEnd ? new Date(formData.termEnd) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowTermEndPicker(false);
                      if (selectedDate) {
                        const iso = selectedDate.toISOString().split('T')[0];
                        setFormData({ ...formData, termEnd: iso });
                      }
                    }}
                  />
                )}
              </View>
            </View>
            {/* Account Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Security</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Application'}</Text>
              </TouchableOpacity>
            </View>

            {/* Information Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>
                Your application will be reviewed by the administrator. You will receive an email notification once your account is approved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 