import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { useUser } from '../../contexts/UserContext';
import { ROUTES } from '../../utils/routes';

export default function LoginScreen() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    console.log('[Login] === Login process started ===');
    console.log('[Login] Email:', email);
    console.log('[Login] Password:', password ? '[HIDDEN]' : 'undefined');
    console.log('[Login] Current state before API call');
    
    debugger; // Debug point 1: Login function entered
    
    if (!email || !password) {
      console.log('[Login] ❌ Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    console.log('[Login] ✅ Input validation passed');
    
    try {
      console.log('[Login] 📡 About to call backend API with:', { email, password: '[HIDDEN]' });
      console.log('[Login] 📡 Using apiClient for login request');
      
      debugger; // Debug point 2: Before API call
      
      const response = await apiClient.post('/auth/login', { email, password });
      console.log('[Login] 📋 API response data:', response.data);
      await login(response.data);
      
      debugger; // Debug point 3: After API call (success)
      
      console.log('[Login] ✅ API call successful');
      console.log('[Login] 📋 API response data:', user);
      console.log('[Login] 👤 User object before login():', user);
      console.log('[Login] 🎭 User role:', user.role);
      console.log('[Login] 🎭 User role type:', typeof user.role);
      console.log('[Login] 🎭 User object keys:', Object.keys(user));
      
      debugger; // Debug point 4: Before calling login(user)
      
      console.log('[Login] 📞 About to call login() from UserContext...');
      await login(user);
      console.log('[Login] ✅ login() call completed successfully');
      
      debugger; // Debug point 5: After login() call
      
      console.log('[Login] ✅ Login process completed successfully');
      console.log('[Login] 🎉 User should now be logged in and navigating...');
      Alert.alert('Success', 'Logged in using database credentials!');
      
    } catch (err) {
      debugger; // Debug point 6: Error occurred
      
      console.log('[Login] ❌ API error occurred');
      console.log('[Login] 🚨 Error type:', err.constructor.name);
      console.log('[Login] 🚨 Error message:', err.message);
      console.log('[Login] 🚨 Error stack:', err.stack);
      
      // Add a single, detailed error log for easy debugging
      console.error('[Login] ERROR DETAILS:', {
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
      });
      
      debugger; // Debug point 7: Before showing error alert
      
      Alert.alert('Error', `Invalid email or password, or server error.\nType: ${err.constructor.name}\nMessage: ${err.message}`);
    }
    
    console.log('[Login] === Login process ended ===');
  };

  const handleBack = () => {
    router.back();
  };

  const handleFacultySignup = () => {
    router.push(ROUTES.FACULTY_SIGNUP);
  };

  const demoRoles = [
    { label: 'Admin', email: 'admin@university.edu' },
    { label: 'Dean', email: 'dean.johnson@university.edu' },
    { label: 'Program Chair', email: 'chair.davis@university.edu' },
    { label: 'Staff', email: 'jane.staff@university.edu' },
    { label: 'Faculty', email: 'dr.smith@university.edu' },
  ];

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
      marginTop: 0, // Account for global header
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 32,
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 32,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      paddingVertical: 0,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      height: 56,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 0,
      color: '#353A40',
      height: 56,
    },
    passwordToggle: {
      padding: 8,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: '#DC2626',
      fontSize: 14,
      fontWeight: '500',
    },
    loginButton: {
      backgroundColor: '#DC2626',
      paddingVertical: 0,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      height: 56,
      ...shadowStyle,
    },
    loginButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    signupButton: {
      paddingVertical: 0,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#353A40',
      backgroundColor: '#F9FAFB',
      marginBottom: 32,
      height: 56,
    },
    signupButtonText: {
      color: '#353A40',
      fontSize: 16,
      fontWeight: '600',
    },
    demoSection: {
      padding: 20,
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#F3F4F6',
    },
    demoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#353A40',
      marginBottom: 16,
      textAlign: 'center',
    },
    demoButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 8,
    },
    demoButton: {
      flex: 1,
      minWidth: '48%',
      paddingVertical: 0,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: '#DC2626',
      borderRadius: 12,
      backgroundColor: '#FEF2F2',
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    demoButtonText: {
      color: '#DC2626',
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
    },
    facultyButton: {
      flex: 1,
      minWidth: '100%',
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#353A40', marginBottom: 16 }}>
                Welcome Back
              </Text>
              <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
                Sign in to your account to continue
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
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

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.signupButton} onPress={handleFacultySignup}>
              <Text style={styles.signupButtonText}>Create Faculty Account</Text>
            </TouchableOpacity>

            {/* Demo Section */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Quick Demo</Text>
              <View style={styles.demoButtons}>
                {demoRoles.map((role) => (
                  <TouchableOpacity
                    key={role.label}
                    style={styles.demoButton}
                    onPress={() => {
                      setEmail(role.email);
                      setPassword('demo123');
                    }}
                  >
                    <Text style={styles.demoButtonText}>{role.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Removed Faculty Button at Bottom */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 