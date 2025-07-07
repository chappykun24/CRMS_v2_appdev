import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { UserRole } from '../types/userRoles';

export default function RoleCapabilitiesScreen() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const roles = [
    {
      role: UserRole.FACULTY,
      icon: 'school-outline',
      title: 'Faculty Member',
      description: 'Manage grades, attendance, and syllabi for assigned courses',
      color: '#DC2626',
      gradient: ['#FEF2F2', '#FEE2E2'],
      capabilities: [
        {
          category: 'Course Management',
          features: [
            'View assigned courses',
            'Create and edit syllabi',
            'Manage course content',
            'Track student progress'
          ]
        },
        {
          category: 'Grade Management',
          features: [
            'Submit student grades',
            'Edit grade entries',
            'Generate grade reports',
            'View grade analytics'
          ]
        },
        {
          category: 'Attendance Management',
          features: [
            'Take daily attendance',
            'Edit attendance records',
            'View attendance reports',
            'Track student participation'
          ]
        },
        {
          category: 'Syllabi Management',
          features: [
            'Create course syllabi',
            'Edit existing syllabi',
            'Submit for approval',
            'View syllabus status'
          ]
        }
      ]
    },
    {
      role: UserRole.STAFF,
      icon: 'people-outline',
      title: 'Staff Member',
      description: 'Encode student information and manage administrative tasks',
      color: '#6B7280',
      gradient: ['#F9FAFB', '#F3F4F6'],
      capabilities: [
        {
          category: 'Student Management',
          features: [
            'Create student records',
            'Edit student information',
            'View all student data',
            'Manage student profiles'
          ]
        },
        {
          category: 'Data Management',
          features: [
            'Encode academic records',
            'Update student status',
            'Generate student reports',
            'Maintain data accuracy'
          ]
        },
        {
          category: 'Administrative Tasks',
          features: [
            'Process enrollment data',
            'Manage course registrations',
            'Generate official reports',
            'Assist with data queries'
          ]
        },
        {
          category: 'System Access',
          features: [
            'View all courses',
            'Access attendance records',
            'Generate department reports',
            'View program analytics'
          ]
        }
      ]
    },
    {
      role: UserRole.PROGRAM_CHAIR,
      icon: 'library-outline',
      title: 'Program Chair',
      description: 'Configure subjects, programs, and manage academic curriculum',
      color: '#DC2626',
      gradient: ['#FEF2F2', '#FEE2E2'],
      capabilities: [
        {
          category: 'Program Management',
          features: [
            'Manage academic programs',
            'Configure curriculum',
            'Set program requirements',
            'Track program performance'
          ]
        },
        {
          category: 'Course Management',
          features: [
            'Create new courses',
            'Edit course details',
            'Assign faculty members',
            'Manage course offerings'
          ]
        },
        {
          category: 'Syllabi Approval',
          features: [
            'Review faculty syllabi',
            'Approve course content',
            'Provide feedback',
            'Ensure compliance'
          ]
        },
        {
          category: 'Academic Oversight',
          features: [
            'Monitor program metrics',
            'Generate program reports',
            'View student analytics',
            'Manage academic policies'
          ]
        }
      ]
    },
    {
      role: UserRole.DEAN,
      icon: 'business-outline',
      title: 'Dean',
      description: 'Approve syllabi, view analytics, and manage college operations',
      color: '#6B7280',
      gradient: ['#F9FAFB', '#F3F4F6'],
      capabilities: [
        {
          category: 'College Management',
          features: [
            'Manage college operations',
            'Oversee academic programs',
            'Set college policies',
            'Coordinate departments'
          ]
        },
        {
          category: 'Faculty Management',
          features: [
            'Manage faculty members',
            'Assign faculty roles',
            'Review faculty performance',
            'Approve faculty hiring'
          ]
        },
        {
          category: 'Syllabi Approval',
          features: [
            'Approve course syllabi',
            'Review academic content',
            'Ensure quality standards',
            'Maintain academic integrity'
          ]
        },
        {
          category: 'Analytics & Reporting',
          features: [
            'View college analytics',
            'Generate comprehensive reports',
            'Monitor performance metrics',
            'Make data-driven decisions'
          ]
        }
      ]
    },
    {
      role: UserRole.ADMIN,
      icon: 'shield-checkmark-outline',
      title: 'System Administrator',
      description: 'Full system access and administrative control',
      color: '#DC2626',
      gradient: ['#FEF2F2', '#FEE2E2'],
      capabilities: [
        {
          category: 'System Administration',
          features: [
            'Manage all system users',
            'Configure system settings',
            'Monitor system performance',
            'Maintain data security'
          ]
        },
        {
          category: 'User Management',
          features: [
            'Create all user accounts',
            'Assign user roles',
            'Manage permissions',
            'Monitor user activity'
          ]
        },
        {
          category: 'Data Management',
          features: [
            'Backup system data',
            'Restore from backups',
            'Audit system logs',
            'Manage data integrity'
          ]
        },
        {
          category: 'Full Access',
          features: [
            'Access all features',
            'View all reports',
            'Manage all departments',
            'System-wide control'
          ]
        }
      ]
    }
  ];

  const handleRolePress = (role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleFacultySignup = () => {
    router.push('/faculty-signup');
  };

  const renderRoleModal = () => (
    <Modal
      visible={showRoleModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.modalRoleIcon, { backgroundColor: selectedRole?.color }]}>
                <Ionicons name={selectedRole?.icon} size={24} color="white" />
              </View>
              <View>
                <Text style={styles.modalRoleTitle}>{selectedRole?.title}</Text>
                <Text style={styles.modalRoleDescription}>{selectedRole?.description}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {selectedRole?.capabilities.map((capability, index) => (
              <View key={index} style={styles.capabilitySection}>
                <Text style={styles.capabilityTitle}>{capability.category}</Text>
                {capability.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={{ width: 40, height: 40, resizeMode: 'contain' }}
            />
          </View>
          <Text style={styles.headerTitle}>Role Capabilities</Text>
          <Text style={styles.headerSubtitle}>Discover what each role can do in CRMS</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Understanding CRMS Roles</Text>
          <Text style={styles.introText}>
            CRMS provides different access levels and capabilities based on your role in the academic community. 
            Each role is designed to support specific responsibilities and workflows.
          </Text>
        </View>

        {/* Roles Grid */}
        <View style={styles.rolesSection}>
          <Text style={styles.sectionTitle}>Available Roles</Text>
          <View style={styles.rolesGrid}>
            {roles.map((role, index) => (
              <TouchableOpacity
                key={index}
                style={styles.roleCard}
                onPress={() => handleRolePress(role)}
              >
                <LinearGradient
                  colors={role.gradient}
                  style={styles.roleCardGradient}
                >
                  <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                    <Ionicons name={role.icon} size={28} color="white" />
                  </View>
                  <Text style={styles.roleCardTitle}>{role.title}</Text>
                  <Text style={styles.roleCardDescription}>{role.description}</Text>
                  <View style={styles.roleCardAction}>
                    <Text style={styles.roleCardActionText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={role.color} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>
            Choose your role and start using CRMS to streamline your academic processes.
          </Text>
          
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.primaryCtaButton} onPress={handleGetStarted}>
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                style={styles.primaryCtaGradient}
              >
                <Text style={styles.primaryCtaText}>Login to CRMS</Text>
                <Ionicons name="log-in-outline" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryCtaButton} onPress={handleFacultySignup}>
              <Text style={styles.secondaryCtaText}>Apply for Faculty Account</Text>
              <Ionicons name="school-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {renderRoleModal()}
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#353A40',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 16,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  rolesSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 24,
    textAlign: 'center',
  },
  rolesGrid: {
    gap: 20,
  },
  roleCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleCardGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  roleCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleCardActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  ctaSection: {
    marginBottom: 40,
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaButtons: {
    gap: 12,
  },
  primaryCtaButton: {
    borderRadius: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryCtaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryCtaButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryCtaText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalRoleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  modalRoleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalBody: {
    flex: 1,
  },
  capabilitySection: {
    marginBottom: 24,
  },
  capabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#353A40',
    marginLeft: 12,
    flex: 1,
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 