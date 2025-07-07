import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    ImageBackground,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const { currentUser, isLoggedIn } = useUser();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [showWelcome, setShowWelcome] = useState(false);
  const [isCheckingWelcome, setIsCheckingWelcome] = useState(true);

  // Check if user has seen welcome screen
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        // For testing, clear the welcome status
        await AsyncStorage.removeItem('hasSeenWelcome');
        
        const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
        console.log('Welcome seen status:', welcomeSeen);
        
        if (welcomeSeen !== 'true') {
          setShowWelcome(true);
        }
        setIsCheckingWelcome(false);
      } catch (error) {
        console.log('Error checking welcome status:', error);
        setIsCheckingWelcome(false);
      }
    };

    checkWelcomeStatus();
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn && currentUser && !showWelcome && !isCheckingWelcome) {
      router.replace('/dashboard');
    }
  }, [isLoggedIn, currentUser, showWelcome, isCheckingWelcome]);

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  };

  const handleNavigation = (route) => {
    closeSidebar();
    if (route === '/') {
      // Already on home page
      return;
    } else if (route === '/login') {
      router.push('/login');
    } else if (route === '/role-selection') {
      router.push('/role-selection');
    } else if (route === '/faculty-signup') {
      router.push('/faculty-signup');
    } else if (route === '/about') {
      // Handle about page navigation
      Alert.alert('About CRMS', 'CRMS v1.0.0\nA comprehensive class record management system for universities.\n\nDeveloped by CICS - Batangas State University Lipa');
    } else if (route === '/help') {
      // Handle help page navigation
      Alert.alert('Help & Support', 'For technical support, please contact:\n\nEmail: cics@batstate-u.edu.ph\nPhone: +63 43 123 4567\n\nOffice Hours: Monday - Friday, 8:00 AM - 5:00 PM');
    } else if (route === '/settings') {
      // Handle settings page navigation
      Alert.alert('Settings', 'Settings functionality coming soon!');
    }
  };

  const users = [
    {
      icon: 'person-outline',
      title: 'Faculty',
      description: 'Manage grades & attendance',
    },
    {
      icon: 'people-outline',
      title: 'Staff',
      description: 'Encode student information',
    },
    {
      icon: 'business-outline',
      title: 'Program Chair',
      description: 'Configure subjects & programs',
    },
    {
      icon: 'shield-outline',
      title: 'Dean',
      description: 'Approve syllabi & view analytics',
    },
  ];

  const sidebarItems = [
    {
      icon: 'home-outline',
      title: 'Home',
      route: '/',
      description: 'Main landing page',
    },
    {
      icon: 'log-in-outline',
      title: 'Login',
      route: '/login',
      description: 'Access your account',
    },
    {
      icon: 'information-circle-outline',
      title: 'Role Capabilities',
      route: '/role-selection',
      description: 'See what each role can do',
    },
    {
      icon: 'school-outline',
      title: 'Faculty Signup',
      route: '/faculty-signup',
      description: 'Apply for faculty account',
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      route: '/about',
      description: 'Learn more about CRMS',
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      route: '/help',
      description: 'Get assistance',
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      route: '/settings',
      description: 'System preferences',
    },
  ];

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleLearnMore = () => {
    router.push('/role-selection');
  };

  // Import WelcomeScreen component
  const WelcomeScreen = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);

    const slides = [
      {
        id: 1,
        title: 'Welcome to CRMS',
        subtitle: 'Class Record Management System',
        description: 'A comprehensive digital solution for managing academic records, grades, and student information at Batangas State University.',
        icon: 'school-outline',
        image: require('../assets/images/logo.png'),
        gradient: ['#4F46E5', '#7C3AED']
      },
      {
        id: 2,
        title: 'Smart Grade Management',
        subtitle: 'Efficient & Accurate',
        description: 'Streamline your grading process with automated calculations, attendance tracking, and comprehensive student performance analytics.',
        icon: 'analytics-outline',
        image: require('../assets/images/logo.png'),
        gradient: ['#059669', '#10B981']
      },
      {
        id: 3,
        title: 'Role-Based Access',
        subtitle: 'Secure & Organized',
        description: 'Different access levels for Faculty, Staff, Program Chairs, and Deans ensure data security while maintaining workflow efficiency.',
        icon: 'shield-checkmark-outline',
        image: require('../assets/images/logo.png'),
        gradient: ['#DC2626', '#EF4444']
      },
      {
        id: 4,
        title: 'Ready to Get Started?',
        subtitle: 'Join CRMS Today',
        description: 'Experience the future of academic record management. Login or sign up to begin your journey with CRMS.',
        icon: 'rocket-outline',
        image: require('../assets/images/logo.png'),
        gradient: ['#7C2D12', '#EA580C']
      }
    ];

    const markWelcomeAsSeen = async () => {
      try {
        await AsyncStorage.setItem('hasSeenWelcome', 'true');
      } catch (error) {
        console.log('Error saving welcome status:', error);
      }
    };

    const handleNext = async () => {
      if (currentIndex < slides.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true
        });
      } else {
        // Mark welcome as seen and hide welcome screen
        await markWelcomeAsSeen();
        setShowWelcome(false);
      }
    };

    const handleSkip = async () => {
      // Mark welcome as seen and hide welcome screen
      await markWelcomeAsSeen();
      setShowWelcome(false);
    };

    const handleScroll = (event) => {
      const contentOffset = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffset / width);
      setCurrentIndex(index);
    };

    const renderSlide = (slide, index) => {
      console.log('Rendering slide:', slide.title, 'at index:', index);
      return (
        <View key={slide.id} style={welcomeStyles.slide}>
          <LinearGradient
            colors={slide.gradient}
            style={welcomeStyles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <SafeAreaView style={welcomeStyles.slideContent}>
              {/* Skip Button */}
              <TouchableOpacity style={welcomeStyles.skipButton} onPress={handleSkip}>
                <Text style={welcomeStyles.skipText}>Skip</Text>
              </TouchableOpacity>

              {/* Main Content */}
              <View style={welcomeStyles.mainContent}>
                {/* Icon */}
                <View style={welcomeStyles.iconContainer}>
                  <Ionicons name={slide.icon} size={80} color="#FFFFFF" />
                </View>

                {/* Image */}
                <View style={welcomeStyles.imageContainer}>
                  <Image source={slide.image} style={welcomeStyles.slideImage} resizeMode="contain" />
                </View>

                {/* Text Content */}
                <View style={welcomeStyles.textContainer}>
                  <Text style={welcomeStyles.slideTitle}>{slide.title}</Text>
                  <Text style={welcomeStyles.slideSubtitle}>{slide.subtitle}</Text>
                  <Text style={welcomeStyles.slideDescription}>{slide.description}</Text>
                </View>
              </View>

              {/* Bottom Navigation */}
              <View style={welcomeStyles.bottomContainer}>
                {/* Dots Indicator */}
                <View style={welcomeStyles.dotsContainer}>
                  {slides.map((_, dotIndex) => (
                    <View
                      key={dotIndex}
                      style={[
                        welcomeStyles.dot,
                        dotIndex === index && welcomeStyles.activeDot
                      ]}
                    />
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={welcomeStyles.buttonContainer}>
                  {index < slides.length - 1 ? (
                    <TouchableOpacity style={welcomeStyles.nextButton} onPress={handleNext}>
                      <Text style={welcomeStyles.nextButtonText}>Next</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={welcomeStyles.getStartedButton} onPress={handleNext}>
                      <Text style={welcomeStyles.getStartedButtonText}>Get Started</Text>
                      <Ionicons name="rocket" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>
      );
    };

    console.log('WelcomeScreen rendering with slides:', slides.length);
    return (
      <View style={welcomeStyles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={welcomeStyles.scrollView}
        >
          {slides.map((slide, index) => renderSlide(slide, index))}
        </ScrollView>
      </View>
    );
  };

  // Show welcome screen if user hasn't seen it
  console.log('showWelcome:', showWelcome, 'isCheckingWelcome:', isCheckingWelcome);
  
  if (showWelcome) {
    console.log('Rendering WelcomeScreen');
    return <WelcomeScreen />;
  }

  // Show loading while checking welcome status
  if (isCheckingWelcome) {
    console.log('Rendering loading screen');
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.burgerButton} onPress={toggleSidebar}>
            <Ionicons name="menu-outline" size={24} color="#353A40" />
          </TouchableOpacity>
          <View style={styles.centerContent}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: 32, height: 32, resizeMode: 'contain' }}
              />
            </View>
            <Text style={styles.headerTitle}>CRMS</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Sidebar */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSidebar}
      >
        <TouchableOpacity style={styles.sidebarOverlay} onPress={closeSidebar}>
          <Animated.View 
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarHeaderLeft}>
                <View style={styles.sidebarLogo}>
                  <Image 
                    source={require('../assets/images/logo.png')} 
                    style={{ width: 32, height: 32, resizeMode: 'contain' }}
                  />
                </View>
                <Text style={styles.sidebarTitle}>CRMS</Text>
              </View>
              <TouchableOpacity style={styles.sidebarCloseButton} onPress={closeSidebar}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sidebarContent}>
              {/* Main Navigation */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Navigation</Text>
                {sidebarItems.slice(0, 3).map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sidebarItem}
                    onPress={() => handleNavigation(item.route)}
                  >
                    <View style={styles.sidebarItemIcon}>
                      <Ionicons name={item.icon} size={20} color="#DC2626" />
                    </View>
                    <View style={styles.sidebarItemContent}>
                      <Text style={styles.sidebarItemText}>{item.title}</Text>
                      <Text style={styles.sidebarItemDescription}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Support & Settings */}
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Support & Settings</Text>
                {sidebarItems.slice(3).map((item, index) => (
                  <TouchableOpacity
                    key={index + 3}
                    style={styles.sidebarItem}
                    onPress={() => handleNavigation(item.route)}
                  >
                    <View style={styles.sidebarItemIcon}>
                      <Ionicons name={item.icon} size={20} color="#DC2626" />
                    </View>
                    <View style={styles.sidebarItemContent}>
                      <Text style={styles.sidebarItemText}>{item.title}</Text>
                      <Text style={styles.sidebarItemDescription}>{item.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sidebarFooter}>
              <View style={styles.sidebarFooterContent}>
                <Text style={styles.sidebarFooterText}>© 2024 CRMS</Text>
                <Text style={styles.sidebarFooterSubtext}>CICS - Batangas State University Lipa</Text>
                <Text style={styles.sidebarFooterVersion}>Version 1.0.0</Text>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Hero Section */}
        <ImageBackground
          source={require('../assets/images/lipa-slider-1-scaled.jpg')}
          style={styles.heroImageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>CICS - Batangas State University Lipa</Text>
              </View>
              <Text style={styles.heroTitle}>Class Record Management System</Text>
              <Text style={styles.heroSubtitle}>A system that automates grade computation, monitors student performance, and analyzes learning trend empowering educators with real-time analytics and personalized insights.</Text>
            </View>
            <View style={styles.ctaContainerBottom}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLearnMore}>
                <Text style={styles.secondaryButtonText}>View Roles</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Capabilities</Text>
            <Text style={styles.sectionSubtitle}>
              Addressing the challenges of manual academic management
            </Text>
          </View>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.featureIconContainer}
              >
                <Ionicons name="analytics-outline" size={28} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Real-Time Analytics</Text>
              <Text style={styles.featureDescription}>Monitor student performance, grade distributions, and academic trends with live data visualization</Text>
            </View>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.featureIconContainer}
              >
                <Ionicons name="document-text-outline" size={28} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Automated Grading</Text>
              <Text style={styles.featureDescription}>Eliminate manual errors with intelligent grade computation and timely feedback delivery</Text>
            </View>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.featureIconContainer}
              >
                <Ionicons name="people-circle-outline" size={28} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Learning Behavior Analysis</Text>
              <Text style={styles.featureDescription}>Identify at-risk students and learning patterns through advanced clustering algorithms</Text>
            </View>
          </View>
        </View>

        {/* Users Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For CICS Community</Text>
            <Text style={styles.sectionSubtitle}>
              Tailored access for faculty, staff, and administrators
            </Text>
          </View>
          
          <View style={styles.usersGrid}>
            {users.map((user, index) => (
              <View key={index} style={styles.userCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.userIconContainer}
                >
                  <Ionicons name={user.icon} size={24} color="#DC2626" />
                </LinearGradient>
                <Text style={styles.userTitle}>{user.title}</Text>
                <Text style={styles.userDescription}>{user.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <LinearGradient
          colors={['#F8FAFC', '#F1F5F9']}
          style={styles.statsSection}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>139</Text>
            <Text style={styles.statLabel}>Survey Respondents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>64%</Text>
            <Text style={styles.statLabel}>Career Guidance Value</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>62.6%</Text>
            <Text style={styles.statLabel}>Strengths Analysis</Text>
          </View>
        </LinearGradient>

        {/* Contacts Section */}
        <View style={styles.contactsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.sectionSubtitle}>
              Get in touch with our development team
            </Text>
          </View>
          
          <View style={styles.contactsGrid}>
            <View style={styles.contactCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.contactIconContainer}
              >
                <Ionicons name="school-outline" size={28} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.contactTitle}>CICS Department</Text>
              <Text style={styles.contactName}>College of Informatics and Computing Sciences</Text>
              <Text style={styles.contactEmail}>cics@batstate-u.edu.ph</Text>
              <Text style={styles.contactPhone}>+63 43 123 4567</Text>
            </View>
            
            <View style={styles.contactCard}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2']}
                style={styles.contactIconContainer}
              >
                <Ionicons name="location-outline" size={28} color="#DC2626" />
              </LinearGradient>
              <Text style={styles.contactTitle}>Location</Text>
              <Text style={styles.contactName}>Batangas State University Lipa</Text>
              <Text style={styles.contactAddress}>Lipa City, Batangas</Text>
              <Text style={styles.contactAddress}>Philippines</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  burgerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
  },
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F8FAFC',
  },
  sidebarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarCloseButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sidebarLogo: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#DC2626',
    borderRadius: 12,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#353A40',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 16,
  },
  sidebarSection: {
    marginBottom: 24,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  sidebarItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sidebarItemContent: {
    flex: 1,
  },
  sidebarItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  sidebarItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  sidebarFooter: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F8FAFC',
  },
  sidebarFooterContent: {
    alignItems: 'center',
  },
  sidebarFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    textAlign: 'center',
    marginBottom: 4,
  },
  sidebarFooterSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  sidebarFooterVersion: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  heroImageBackground: { width: '100%', minHeight: height * 0.6, justifyContent: 'flex-start' },
  heroOverlay: { 
    flex: 1, 
    justifyContent: 'flex-start', 
    paddingTop: 80, 
    paddingBottom: 80, 
    paddingHorizontal: 20 
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  heroBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  ctaContainerBottom: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 40,
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    color: '#DC2626',
    fontSize: 18,
    fontWeight: '700',
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: 'white',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 24,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  usersSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: '#F8FAFC',
  },
  usersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: (width - 60) / 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  userDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  contactsSection: {
    paddingHorizontal: 20,
    paddingVertical: 80,
    backgroundColor: 'white',
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: (width - 60) / 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactPhone: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactAddress: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaContainerBottom: { position: 'absolute', left: 0, right: 0, bottom: 32, flexDirection: 'row', justifyContent: 'center', gap: 16, paddingHorizontal: 20, zIndex: 2 },
});

// Welcome screen styles
const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
  },
  gradientBackground: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    marginBottom: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: 80,
    height: 80,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  slideDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedButtonText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
