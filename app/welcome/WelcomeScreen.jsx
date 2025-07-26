import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const slides = [
    {
      id: 1,
      title: 'Class Record Management',
      description: 'A comprehensive digital solution for managing academic records and student information.',
      icon: 'library-outline',
      gradient: ['#DC2626', '#B91C1C']
    },
    {
      id: 2,
      title: 'Attendance Monitoring',
      description: 'Track student attendance and monitor class participation with real-time updates.',
      icon: 'checkmark-circle-outline',
      gradient: ['#DC2626', '#B91C1C']
    },
    {
      id: 3,
      title: 'Automated Grading',
      description: 'Eliminate manual errors with intelligent grade computation and timely feedback.',
      icon: 'calculator-outline',
      gradient: ['#DC2626', '#B91C1C']
    },
    {
      id: 4,
      title: 'Smart Analytics',
      description: 'Monitor student performance and track academic trends with real-time insights.',
      icon: 'trending-up-outline',
      gradient: ['#DC2626', '#B91C1C']
    }
  ];

  const markWelcomeAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      router.push('/public');
    } catch (error) {
      router.push('/public');
    }
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      await markWelcomeAsSeen();
    }
  };

  const handleSkip = async () => {
    await markWelcomeAsSeen();
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView style={welcomeStyles.container}> 
      {/* Minimal Header */}
      <View style={welcomeStyles.fixedHeader}>
        {/* Transparent IP Detection Button (top left) */}
        <TouchableOpacity
          style={welcomeStyles.ipButton}
          onPress={async () => {
            await AsyncStorage.removeItem('API_BASE_URL');
            await AsyncStorage.setItem('FORCE_IP_INPUT', 'true');
            router.replace('/'); // Go to root, which will trigger IP detection
          }}
        >
          <Ionicons name="settings-outline" size={24} color="#6B7280" style={{ opacity: 0.5 }} />
        </TouchableOpacity>
        <TouchableOpacity style={welcomeStyles.skipButton} onPress={handleSkip}>
          <Text style={welcomeStyles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={welcomeStyles.scrollView}
        contentContainerStyle={welcomeStyles.scrollContent}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={welcomeStyles.slideContent}>
            <View style={welcomeStyles.mainContent}>
              <View style={welcomeStyles.iconContainer}>
                <Ionicons name={slide.icon} size={48} color="#DC2626" />
              </View>
              <View style={welcomeStyles.textContainer}>
                <Text style={welcomeStyles.slideTitle}>{slide.title}</Text>
                <Text style={welcomeStyles.slideDescription}>{slide.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Minimal Bottom Navigation */}
      <View style={welcomeStyles.fixedBottom}>
        {/* Dots Indicator */}
        <View style={welcomeStyles.dotsContainer}>
          {slides.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                welcomeStyles.dot,
                dotIndex === currentIndex && welcomeStyles.activeDot
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <View style={welcomeStyles.buttonContainer}>
          {currentIndex === slides.length - 1 && (
            <TouchableOpacity style={welcomeStyles.getStartedButton} onPress={handleNext}>
              <Text style={welcomeStyles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  ipButton: {
    position: 'absolute',
    left: 8,
    top: 36,
    padding: 8,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  slideContent: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: '#FEF2F2',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  slideDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  fixedBottom: {
    paddingBottom: 40,
    paddingTop: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#DC2626',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  getStartedButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  getStartedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
}); 