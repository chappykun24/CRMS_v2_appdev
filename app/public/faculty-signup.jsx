import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import apiClient from '../../utils/api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermStartPicker, setShowTermStartPicker] = useState(false);
  const [showTermEndPicker, setShowTermEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

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

  
  const shadowStyle = {
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(220,38,38,0.2)' }
      : {
          shadowColor: '#DC2626',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }),
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 90,
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
      backgroundColor: '#DC2626',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
      opacity: 1,
      ...shadowStyle,
    },
    submitButtonDisabled: {
      backgroundColor: '#DC2626',
      opacity: 0.5,
    },
    submitButtonText: {
      color: 'white',
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
  });

  return (
    <SafeAreaView style={styles.container}>
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
            {/* Title + Fill Button Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 24 }}>
              <Text style={{ flex: 1, fontSize: 28, fontWeight: 'bold', color: '#353A40', textAlign: 'left' }}>
                Faculty Registration
              </Text>
              <TouchableOpacity
                onPress={fillRandomData}
                style={{ marginLeft: 24, paddingVertical: 4, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#64748b', justifyContent: 'center', alignItems: 'center' }}
                accessibilityLabel="Fill random data"
                activeOpacity={0.8}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Fill</Text>
              </TouchableOpacity>
            </View>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  placeholder="Enter your last name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="Enter your first name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Middle Initial</Text>
                <TextInput
                  style={styles.input}
                  value={formData.middleInitial}
                  onChangeText={(text) => setFormData({ ...formData, middleInitial: text })}
                  placeholder="M"
                  maxLength={1}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Suffix</Text>
                <TextInput
                  style={styles.input}
                  value={formData.suffix}
                  onChangeText={(text) => setFormData({ ...formData, suffix: text })}
                  placeholder="Jr., Sr., III, etc. (optional)"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'Submitting...' : 'Submit Application'}</Text>
            </TouchableOpacity>

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