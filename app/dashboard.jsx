import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../contexts/UserContext';
import { UserRole, getRoleDisplayName, getUserDisplayName } from '../types/userRoles';

export default function DashboardScreen() {
  const { currentUser, logout, hasPermission } = useUser();
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Redirect admin users to admin dashboard
  if (currentUser.role === UserRole.ADMIN) {
    router.replace('/admin-dashboard');
    return null;
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  const getRoleColor = (role) => {
    const colors = {
      [UserRole.ADMIN]: '#DC2626',
      [UserRole.STAFF]: '#6B7280',
      [UserRole.FACULTY]: '#DC2626',
      [UserRole.DEAN]: '#6B7280',
      [UserRole.PROGRAM_CHAIR]: '#DC2626',
    };
    return colors[role];
  };

  const getRoleIcon = (role) => {
    const icons = {
      [UserRole.ADMIN]: 'shield-checkmark-outline',
      [UserRole.STAFF]: 'people-outline',
      [UserRole.FACULTY]: 'school-outline',
      [UserRole.DEAN]: 'business-outline',
      [UserRole.PROGRAM_CHAIR]: 'library-outline',
    };
    return icons[role];
  };

  const getDashboardFeatures = () => {
    const features = [];

    // User Management Features (for Dean and Program Chair)
    if (hasPermission('canCreateUsers')) {
      features.push({
        icon: 'person-add-outline',
        title: 'Manage Users',
        description: 'Create, edit, and manage system users',
        color: '#DC2626',
        onPress: () => Alert.alert('Feature', 'User Management - Coming Soon!'),
        section: 'User Management'
      });
    }

    // Student Management Features
    if (hasPermission('canCreateStudents')) {
      features.push({
        icon: 'people-circle-outline',
        title: 'Student Management',
        description: 'Manage student records and information',
        color: '#6B7280',
        onPress: () => Alert.alert('Feature', 'Student Management - Coming Soon!'),
        section: 'Student Management'
      });
    }

    // Course Management Features
    if (hasPermission('canCreateCourses')) {
      features.push({
        icon: 'library-outline',
        title: 'Course Management',
        description: 'Create and manage courses',
        color: '#DC2626',
        onPress: () => router.push('/course-management'),
        section: 'Course Management'
      });
    }

    // Grade Management Features
    if (hasPermission('canSubmitGrades')) {
      features.push({
        icon: 'document-text-outline',
        title: 'Grade Management',
        description: 'Submit and manage student grades',
        color: '#6B7280',
        onPress: () => Alert.alert('Feature', 'Grade Management - Coming Soon!'),
        section: 'Grade Management'
      });
    }

    // Attendance Features
    if (hasPermission('canTakeAttendance')) {
      features.push({
        icon: 'calendar-outline',
        title: 'Attendance',
        description: 'Take and manage student attendance',
        color: '#DC2626',
        onPress: () => Alert.alert('Feature', 'Attendance Management - Coming Soon!'),
        section: 'Attendance Management'
      });
    }

    // Syllabi Management Features (for Faculty)
    if (hasPermission('canCreateSyllabi')) {
      features.push({
        icon: 'document-text-outline',
        title: 'Create Syllabi',
        description: 'Create and manage course syllabi',
        color: '#DC2626',
        onPress: () => router.push('/syllabi-creation'),
        section: 'Academic Management'
      });
    }

    if (hasPermission('canViewOwnSyllabi')) {
      features.push({
        icon: 'folder-open-outline',
        title: 'My Syllabi',
        description: 'View and edit your created syllabi',
        color: '#6B7280',
        onPress: () => router.push('/my-syllabi'),
        section: 'Academic Management'
      });
    }

    // Reports and Analytics
    if (hasPermission('canViewReports')) {
      features.push({
        icon: 'analytics-outline',
        title: 'Reports & Analytics',
        description: 'View performance reports and analytics',
        color: '#6B7280',
        onPress: () => Alert.alert('Feature', 'Reports & Analytics - Coming Soon!'),
        section: 'Reports & Analytics'
      });
    }

    // Syllabus Management (for Dean and Program Chair)
    if (hasPermission('canApproveSyllabi')) {
      features.push({
        icon: 'document-outline',
        title: 'Syllabus Approval',
        description: 'Review and approve course syllabi',
        color: '#DC2626',
        onPress: () => Alert.alert('Feature', 'Syllabus Approval - Coming Soon!'),
        section: 'Academic Management'
      });
    }

    // Program Management (for Program Chair)
    if (hasPermission('canManagePrograms')) {
      features.push({
        icon: 'library-outline',
        title: 'Program Management',
        description: 'Manage academic programs and curriculum',
        color: '#DC2626',
        onPress: () => Alert.alert('Feature', 'Program Management - Coming Soon!'),
        section: 'Academic Management'
      });
    }

    // Faculty Management (for Dean)
    if (hasPermission('canManageFaculty')) {
      features.push({
        icon: 'people-outline',
        title: 'Faculty Management',
        description: 'Manage faculty members and assignments',
        color: '#6B7280',
        onPress: () => Alert.alert('Feature', 'Faculty Management - Coming Soon!'),
        section: 'Academic Management'
      });
    }

    return features;
  };

  const getQuickStats = () => {
    const stats = [];

    if (hasPermission('canViewStudentStats')) {
      stats.push({
        icon: 'people-circle-outline',
        value: '250+',
        label: 'Students',
        color: '#DC2626'
      });
    }

    if (hasPermission('canViewCourseStats')) {
      stats.push({
        icon: 'library-outline',
        value: '45',
        label: 'Courses',
        color: '#6B7280'
      });
    }

    if (hasPermission('canViewFacultyStats')) {
      stats.push({
        icon: 'school-outline',
        value: '25',
        label: 'Faculty',
        color: '#DC2626'
      });
    }

    if (hasPermission('canViewGradeStats')) {
      stats.push({
        icon: 'document-text-outline',
        value: '98%',
        label: 'Pass Rate',
        color: '#6B7280'
      });
    }

    return stats;
  };

  const handleBurgerMenu = () => {
    setShowBurgerMenu(!showBurgerMenu);
  };

  const handleProfileEdit = () => {
    setShowBurgerMenu(false);
    Alert.alert('Edit Profile', 'Profile editing functionality - Coming Soon!');
  };

  const handleChangePassword = () => {
    setShowBurgerMenu(false);
    Alert.alert('Change Password', 'Password change functionality - Coming Soon!');
  };

  const handleHelpSupport = () => {
    setShowBurgerMenu(false);
    Alert.alert('Help & Support', 'Help and support functionality - Coming Soon!');
  };

  const handleAbout = () => {
    setShowBurgerMenu(false);
    Alert.alert('About CRMS', 'CRMS v1.0.0\nA comprehensive class record management system for universities.');
  };

  const features = getDashboardFeatures();
  const stats = getQuickStats();

  // Group features by section
  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.section]) {
      acc[feature.section] = [];
    }
    acc[feature.section].push(feature);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Logo and Burger Menu Only */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.burgerButton} onPress={handleBurgerMenu}>
              <Ionicons name="menu-outline" size={24} color="#353A40" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: 32, height: 32, resizeMode: 'contain' }}
              />
              <Text style={styles.logoText}>CRMS</Text>
            </View>
          </View>
        </View>
      </View>

      {/* User Info Section */}
      <View style={styles.userInfoSection}>
        <View style={styles.userInfoContent}>
          <View style={styles.userInfoLeft}>
            <View style={[styles.roleIcon, { backgroundColor: getRoleColor(currentUser.role) }]}>
              <Ionicons name={getRoleIcon(currentUser.role)} size={24} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{getUserDisplayName(currentUser)}</Text>
              <Text style={styles.userRole}>{getRoleDisplayName(currentUser.role)}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfileEdit}>
            <Ionicons name="person-circle-outline" size={24} color="#353A40" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Burger Menu */}
      {showBurgerMenu && (
        <View style={styles.burgerMenu}>
          <View style={styles.menuHeader}>
            <View style={styles.menuUserInfo}>
              <View style={[styles.menuRoleIcon, { backgroundColor: getRoleColor(currentUser.role) }]}>
                <Ionicons name={getRoleIcon(currentUser.role)} size={20} color="white" />
              </View>
              <View style={styles.menuUserDetails}>
                <Text style={styles.menuUserName}>{getUserDisplayName(currentUser)}</Text>
                <Text style={styles.menuUserRole}>{getRoleDisplayName(currentUser.role)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleBurgerMenu}>
              <Ionicons name="close" size={24} color="#353A40" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem} onPress={handleProfileEdit}>
              <Ionicons name="person-outline" size={20} color="#353A40" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
              <Ionicons name="lock-closed-outline" size={20} color="#353A40" />
              <Text style={styles.menuItemText}>Change Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
              <Ionicons name="help-circle-outline" size={20} color="#353A40" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
              <Ionicons name="information-circle-outline" size={20} color="#353A40" />
              <Text style={styles.menuItemText}>About</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuFooter}>
            <TouchableOpacity style={styles.logoutMenuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutMenuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role-Specific Features - Organized by Functionality */}
        {Object.entries(groupedFeatures).map(([sectionName, features]) => (
          <View key={sectionName} style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionName}</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.featureCard}
                  onPress={feature.onPress}
                >
                  <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                    <Ionicons name={feature.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Quick Stats */}
        {stats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Overview</Text>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                    <Ionicons name={stat.icon} size={20} color="white" />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>Welcome to your personalized dashboard!</Text>
            <Text style={styles.activitySubtext}>
              Your available features are based on your role permissions.
            </Text>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  burgerButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  userInfoSection: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#353A40',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 8,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  burgerMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuRoleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuUserDetails: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  menuUserRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuItems: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: '#353A40',
    marginLeft: 12,
  },
  menuFooter: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutMenuItemText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '600',
  },
}); 