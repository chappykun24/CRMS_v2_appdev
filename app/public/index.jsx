import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../contexts/UserContext';
import { ROUTES } from '../../utils/routes';
import Slideshow from '../components/Slideshow';

const { width, height } = Dimensions.get('window');

const shadowStyle1 = {
  ...(Platform.OS === 'web'
    ? { boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      }),
};
const shadowStyle2 = {
  ...(Platform.OS === 'web'
    ? { boxShadow: '0px 4px 8px rgba(220,38,38,0.3)' }
    : {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      }),
};
const shadowStyle3 = {
  ...(Platform.OS === 'web'
    ? { boxShadow: '0px -2px 4px rgba(0,0,0,0.1)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }),
};

export default function LandingPage() {
  const { currentUser, isLoggedIn } = useUser();
  const scrollViewRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Animated values for header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkWelcomeStatus = async () => {
      try {
        const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
        if (welcomeSeen !== 'true') {
          router.push('/welcome');
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
      }
    };
    
    checkWelcomeStatus();
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 50); // Show button after scrolling 50px
    
    // Update scroll animated value
    scrollY.setValue(offsetY);
    
    // Animation thresholds
    const headerThreshold = 20; // When to start animation
    const animationRange = 80; // Animation duration range
    
    // Calculate animation progress (0 to 1)
    const progress = Math.min(Math.max((offsetY - headerThreshold) / animationRange, 0), 1);
    
    // Animate header opacity (fade text slightly)
    headerOpacity.setValue(progress);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  const handleNavigation = (route) => {
    switch (route) {
      case '/':
      case '/public':
        router.push('/public');
        break;
      case '/login':
      case '/public/login':
        router.push('/public/login');
    
        break;
      case '/help':
      case '/public/help':
        router.push('/public/help');
        break;
      default:
        break;
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

  const bottomNavItems = [
    {
      icon: 'home-outline',
      activeIcon: 'home',
      title: 'Home',
      route: '/public',
    },
    {
      icon: 'log-in-outline',
      activeIcon: 'log-in',
      title: 'Login',
      route: '/public/login',
    },
    {
      icon: 'help-circle-outline',
      activeIcon: 'help-circle',
      title: 'Help',
      route: '/public/help',
    },
  ];

  const handleGetStarted = () => {
    router.push(ROUTES.LOGIN);
  };

  const handleLearnMore = () => {
    router.push(ROUTES.ROLE_SELECTION);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ref={scrollViewRef}
      >
        {/* Modern Header */}
        <View style={styles.headerSection}>
          <Image
            source={require('../../assets/images/bsu-logo.png')}
            style={styles.headerLogoLarge}
            resizeMode="contain"
          />
          <Animated.Text style={[
            styles.headerTitleModern,
            {
              opacity: headerOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.7]
              })
            }
          ]}>
            Batangas State University
          </Animated.Text>
          <Text style={styles.headerSubtitleModern}>The Philippines' National Engineering University</Text>
        </View>
        <Slideshow />
        {/* Minimalist Main Context Below Slideshow */}
        <View style={{
          width: '100%',
          alignItems: 'center',
          marginTop: 0,
          backgroundColor: '#FFFFFF',
          paddingVertical: 10,
          marginBottom: 0,
          paddingHorizontal: 20,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 12, fontFamily: 'sans-serif' }}>
            Simplifying Academic Management
          </Text>
          <Text style={{ fontSize: 14, color: '#444', textAlign: 'center', maxWidth: 400, lineHeight: 20, fontFamily: 'sans-serif-light' }}>
            Class Record Management System empowers BatStateU Lipa faculty and administrators
            with tools for smart grading, attendance tracking, and
            student performance analytics all in one place.
          </Text>
        </View>

        {/* Three Class Record Icons Containers */}
        <View style={styles.photoContainersSection}>
          <View style={styles.horizontalContainer}>
            <View style={styles.featureCard}>
              <Ionicons name="document-text-outline" size={40} color="#DC2626" />
              <Text style={styles.featureCardTitle}>Grade Records</Text>
              <Text style={styles.featureCardDescription}>Manage student grades and assessments</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="people-outline" size={40} color="#DC2626" />
              <Text style={styles.featureCardTitle}>Attendance</Text>
              <Text style={styles.featureCardDescription}>Track student attendance and participation</Text>
            </View>

            <View style={styles.featureCard}>
              <Ionicons name="analytics-outline" size={40} color="#DC2626" />
              <Text style={styles.featureCardTitle}>Analytics</Text>
              <Text style={styles.featureCardDescription}>View performance reports and insights</Text>
            </View>
          </View>
        </View>

        {/* Additional Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Real-time grade tracking and calculations</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Automated attendance monitoring</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Comprehensive student performance analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Secure data management and backup</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Mobile-friendly interface for easy access</Text>
            </View>
          </View>
        </View>

        {/* University Info Section */}
        <View style={styles.universitySection}>
          <Text style={styles.sectionTitle}>About BatStateU Lipa</Text>
          <Text style={styles.universityDescription}>
            Batangas State University Lipa Campus is committed to providing quality education 
            and innovative solutions for academic excellence. Our Class Record Management System 
            represents our dedication to modernizing educational processes and supporting our 
            faculty in delivering the best learning experience for our students.
          </Text>
        </View>
      </ScrollView>
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity 
          style={styles.scrollTopButton} 
          onPress={scrollToTop}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-up-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100%',
  },
  photoContainersSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
  },
  // Modern Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 5,
  },
  headerLogoLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    marginBottom: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  headerTitleModern: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerSubtitleModern: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 0,
  },
  // Additional sections styles
  featuresSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 10,
  },
  featuresList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  universitySection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  universityDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 120, // Reduced to be closer to nav bar
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginHorizontal: 6,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 140,
  },
  featureCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureCardDescription: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 14,
  },
}); 