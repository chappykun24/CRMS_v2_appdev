import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  SafeAreaView // Added SafeAreaView
  ,






  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { sampleUsers } from '../../types/sampleData';
import apiClient from '../../utils/api';
import { ROUTES } from '../../utils/routes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Public navigation items only
const publicNavItems = [
  { icon: 'home-outline', activeIcon: 'home', title: 'Home', route: ROUTES.PUBLIC },
  { icon: 'log-in-outline', activeIcon: 'log-in', title: 'Login', route: ROUTES.LOGIN },
  { icon: 'help-circle-outline', activeIcon: 'help-circle', title: 'Help', route: ROUTES.HELP },
];

export default function PublicBottomNav({ activeRoute }) {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Drag animation values
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dragXAnim = useRef(new Animated.Value(0)).current;
  const dragYAnim = useRef(new Animated.Value(0)).current;

  const handleShowLoginForm = () => {
    setShowLoginForm(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleHideLoginForm = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
    });
  };

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      // Use backend API for authentication instead of sampleUsers
      console.log('Using dynamic apiClient for login');
      const user = await apiClient.post('/auth/login', { email, password });
      console.log('Login response:', user);
      if (!user || user.error) {
        Alert.alert('Login Failed', user?.error || 'Unknown error');
        return;
      }
      await login(user);
      handleHideLoginForm();
    } catch (error) {
      console.error('[SignIn] Error during login:', error);
      let errorDetails = '';
      if (error.response) {
        errorDetails = `\nStatus: ${error.response.status}\nStatus Text: ${error.response.statusText}\nData: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorDetails = '\nNo response received from server.';
      } else {
        errorDetails = `\nRequest setup error: ${error.message}`;
      }
      Alert.alert('Sign In Error', (error?.message || 'An unknown error occurred.') + errorDetails);
    }
  };

  const handleDemoLogin = (userEmail) => {
    const user = sampleUsers.find(u => u.email === userEmail);
    if (user) {
      setEmail(user.email);
      setPassword('demo123');
      // Removed popup alert for faster interaction
    }
  };

  const handleFacultySignup = () => {
    router.push(ROUTES.FACULTY_SIGNUP);
    handleHideLoginForm();
  };

  // PanResponder for drag functionality
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only start pan responder if there's significant movement
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only move pan responder if there's significant upward movement
        return gestureState.dy < -10; // Only upward movement
      },
      onPanResponderGrant: () => {
        // Reset any existing offset
        dragXAnim.setValue(0);
        dragYAnim.setValue(0);
        
        // Scale up slightly when dragging starts
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow upward movement (negative Y values)
        const newY = Math.min(0, gestureState.dy); // Restrict to upward only
        dragXAnim.setValue(0); // Keep X at 0
        dragYAnim.setValue(newY);
        
        // Check if dragged far enough to trigger login
        const dragDistance = Math.abs(gestureState.dy);
        if (dragDistance > 30 && !showLoginForm) {
          handleShowLoginForm();
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Scale back to normal
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        // Spring back to original position in nav bar
        Animated.spring(dragYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 12,
        }).start();
      },
    })
  ).current;

  const handleNavigation = (route) => {
    if (route === ROUTES.LOGIN) {
      // Just tap to show login form
      handleShowLoginForm();
      return;
    }
    
    if (router && route) {
      try {
        router.push(route);
      } catch (error) {
        console.error('Public navigation error:', error);
      }
    }
  };

  const bottomNavStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 28,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  };

  const demoRoles = [
    { label: 'Admin', email: 'admin@university.edu' },
    { label: 'Dean', email: 'dean.johnson@university.edu' },
    { label: 'Program Chair', email: 'chair.davis@university.edu' },
    { label: 'Staff', email: 'jane.staff@university.edu' },
    { label: 'Faculty', email: 'dr.smith@university.edu' },
  ];

  return (
    <>
      {/* White background container to cover content below the nav bar */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 80, // Adjust as needed to fully cover nav bar and safe area
        backgroundColor: '#FFFFFF',
        zIndex: 9, // Ensure it's below the nav bar (nav bar zIndex: 10)
      }} />
      <SafeAreaView edges={['bottom']} style={{backgroundColor: '#FFFFFF'}}>
        <View style={bottomNavStyle}>
          {publicNavItems.map((item, index) => {
            if (!item || !item.route) {
              return null;
            }
            
            const isActive = activeRoute === item.route || 
                              (activeRoute === '/' && item.route === ROUTES.PUBLIC);
            const isLogin = item.route === ROUTES.LOGIN;
            
            if (isLogin) {
              // Render draggable login button in nav bar
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.bottomNavItem,
                    {
                      transform: [
                        { translateX: dragXAnim },
                        { translateY: dragYAnim },
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <TouchableOpacity
                    style={styles.loginNavItem}
                    onPress={handleShowLoginForm}
                    activeOpacity={0.8}
                  >
                    <View style={styles.loginContentWrapper}>
                      <Ionicons
                        name="chevron-up"
                        size={28}
                        color={'#FFFFFF'}
                      />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.bottomNavItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View>
                  <Ionicons
                    name={isActive && item.activeIcon ? item.activeIcon : item.icon}
                    size={24}
                    color={isActive ? '#DC2626' : '#6B7280'}
                  />
                </View>
                {/* Removed the Text label below the icon */}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Sliding Login Form Overlay */}
      {showLoginForm && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={handleHideLoginForm}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Sliding Login Form */}
      {showLoginForm && (
        <Animated.View
          style={[
            styles.slidingForm,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.slidingFormHeader}>
              <Text style={styles.slidingFormTitle}>Sign In</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleHideLoginForm}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.slidingFormContent}>
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

              {/* Create Faculty Button */}
              <TouchableOpacity style={styles.createFacultyButton} onPress={handleFacultySignup}>
                <Text style={styles.createFacultyButtonText}>Create Faculty Account</Text>
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
                {/* Faculty Button at Bottom */}
                {sampleUsers.find(user => user.role === 'faculty') && (
                  <TouchableOpacity
                    style={[styles.demoButton, styles.facultyButton]}
                    onPress={() => handleDemoLogin(sampleUsers.find(user => user.role === 'faculty').email)}
                  >
                    <Text style={styles.demoButtonText}>
                      Faculty
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bottomNavItem: {
    flexDirection: 'column',
    alignItems: 'center',
    marginHorizontal: 32, // Increased for wider icon spacing
  },
  loginNavItem: {
    backgroundColor: '#DC2626',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -15,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  loginNavText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 6,
    fontSize: 12,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  activeText: {
    color: '#DC2626',
  },
  // Sliding login form styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  slidingForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  slidingFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  slidingFormTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  slidingFormContent: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
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
    marginBottom: 8,
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
    height: 56,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createFacultyButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createFacultyButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
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
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  demoButtonText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  facultyButton: {
    flex: 1,
    minWidth: '100%',
    marginTop: 4,
  },
}); 