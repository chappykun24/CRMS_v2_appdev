import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useUser } from '../contexts/UserContext';
import { UserRole, getRoleDisplayName, getUserDisplayName } from '../types/userRoles';

export default function AdminDashboardScreen() {
  const { currentUser, logout, hasPermission } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    position: ''
  });

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    router.replace('/dashboard');
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

  const handleCreateAccount = (role) => {
    setSelectedRole(role);
    setShowCreateModal(true);
  };

  const handleSubmitCreate = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Here you would typically save the new user to your database
    Alert.alert(
      'Success',
      `Account created for ${formData.firstName} ${formData.lastName} as ${getRoleDisplayName(selectedRole)}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setShowCreateModal(false);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phoneNumber: '',
              department: '',
              position: ''
            });
          }
        }
      ]
    );
  };

  const handleFacultyApproval = () => {
    setShowApprovalModal(true);
  };

  const handleApproveFaculty = (facultyId) => {
    Alert.alert(
      'Approved',
      'Faculty account has been approved',
      [{ text: 'OK', onPress: () => setShowApprovalModal(false) }]
    );
  };

  const handleRejectFaculty = (facultyId) => {
    Alert.alert(
      'Rejected',
      'Faculty account has been rejected',
      [{ text: 'OK', onPress: () => setShowApprovalModal(false) }]
    );
  };

  const pendingFacultyAccounts = [
    {
      id: 'faculty-001',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@university.edu',
      department: 'Computer Science',
      specialization: 'Artificial Intelligence',
      academicRank: 'Assistant Professor',
      phoneNumber: '+1-555-0123',
      dateRequested: '2024-01-15'
    },
    {
      id: 'faculty-002',
      firstName: 'Prof. Michael',
      lastName: 'Chen',
      email: 'michael.chen@university.edu',
      department: 'Computer Science',
      specialization: 'Database Systems',
      academicRank: 'Associate Professor',
      phoneNumber: '+1-555-0124',
      dateRequested: '2024-01-16'
    },
    {
      id: 'faculty-003',
      firstName: 'Dr. Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@university.edu',
      department: 'Information Technology',
      specialization: 'Cybersecurity',
      academicRank: 'Instructor',
      phoneNumber: '+1-555-0125',
      dateRequested: '2024-01-17'
    }
  ];

  // Sample user data for management
  const allUsers = [
    {
      id: 'user-001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@university.edu',
      role: UserRole.DEAN,
      department: 'Engineering',
      status: 'active',
      lastLogin: '2024-01-20'
    },
    {
      id: 'user-002',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@university.edu',
      role: UserRole.FACULTY,
      department: 'Computer Science',
      status: 'active',
      lastLogin: '2024-01-19'
    },
    {
      id: 'user-003',
      firstName: 'Prof. Michael',
      lastName: 'Chen',
      email: 'michael.chen@university.edu',
      role: UserRole.FACULTY,
      department: 'Computer Science',
      status: 'pending',
      lastLogin: null
    },
    {
      id: 'user-004',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@university.edu',
      role: UserRole.PROGRAM_CHAIR,
      department: 'Business',
      status: 'active',
      lastLogin: '2024-01-18'
    },
    {
      id: 'user-005',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@university.edu',
      role: UserRole.STAFF,
      department: 'Administration',
      status: 'active',
      lastLogin: '2024-01-17'
    },
    {
      id: 'user-006',
      firstName: 'Dr. Emily',
      lastName: 'Brown',
      email: 'emily.brown@university.edu',
      role: UserRole.FACULTY,
      department: 'Mathematics',
      status: 'inactive',
      lastLogin: '2024-01-10'
    }
  ];

  const handleUserManagement = () => {
    setShowUserManagementModal(true);
  };

  const handleFilterUsers = (filter) => {
    setSelectedFilter(filter);
  };

  const handleUserAction = (userId, action) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action === 'delete' ? 'Delete' : action === 'deactivate' ? 'Deactivate' : 'Activate',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: () => {
            Alert.alert(
              'Success',
              `User has been ${action === 'delete' ? 'deleted' : action === 'deactivate' ? 'deactivated' : 'activated'} successfully`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
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

  const handleSystemSettings = () => {
    setShowBurgerMenu(false);
    Alert.alert('System Settings', 'System settings functionality - Coming Soon!');
  };

  const handleHelpSupport = () => {
    setShowBurgerMenu(false);
    Alert.alert('Help & Support', 'Help and support functionality - Coming Soon!');
  };

  const handleAbout = () => {
    setShowBurgerMenu(false);
    Alert.alert('About CRMS', 'CRMS v1.0.0\nA comprehensive research management system for universities.');
  };

  // Filter users based on selected filter
  const filteredUsers = allUsers.filter(user => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return user.status === 'active';
    if (selectedFilter === 'pending') return user.status === 'pending';
    if (selectedFilter === 'inactive') return user.status === 'inactive';
    if (selectedFilter === 'faculty') return user.role === UserRole.FACULTY;
    if (selectedFilter === 'dean') return user.role === UserRole.DEAN;
    if (selectedFilter === 'program-chair') return user.role === UserRole.PROGRAM_CHAIR;
    if (selectedFilter === 'staff') return user.role === UserRole.STAFF;
    return true;
  });

  const adminFeatures = [
    // User Management Section
    {
      icon: 'business-outline',
      title: 'Create Dean Account',
      description: 'Create new dean accounts for college management',
      color: '#DC2626',
      onPress: () => handleCreateAccount(UserRole.DEAN),
      section: 'User Management'
    },
    {
      icon: 'library-outline',
      title: 'Create Program Chair Account',
      description: 'Create new program chair accounts',
      color: '#DC2626',
      onPress: () => handleCreateAccount(UserRole.PROGRAM_CHAIR),
      section: 'User Management'
    },
    {
      icon: 'people-outline',
      title: 'Create Staff Account',
      description: 'Create new staff accounts for administrative tasks',
      color: '#DC2626',
      onPress: () => handleCreateAccount(UserRole.STAFF),
      section: 'User Management'
    },
    {
      icon: 'person-circle-outline',
      title: 'Manage Users',
      description: 'View, filter, and manage all system users',
      color: '#DC2626',
      onPress: handleUserManagement,
      section: 'User Management'
    },
    // Faculty Management Section
    {
      icon: 'school-outline',
      title: 'Faculty Applications',
      description: 'Review and approve faculty account applications',
      color: '#DC2626',
      onPress: handleFacultyApproval,
      section: 'Faculty Management'
    },
    // System Management Section
    {
      icon: 'analytics-outline',
      title: 'System Reports',
      description: 'View comprehensive system analytics and reports',
      color: '#DC2626',
      onPress: () => Alert.alert('Feature', 'System Reports - Coming Soon!'),
      section: 'System Management'
    },
    {
      icon: 'settings-outline',
      title: 'System Settings',
      description: 'Manage system configuration and settings',
      color: '#DC2626',
      onPress: () => Alert.alert('Feature', 'System Settings - Coming Soon!'),
      section: 'System Management'
    },
  ];

  // Group features by section
  const groupedFeatures = adminFeatures.reduce((acc, feature) => {
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
              <Text style={styles.logoText}>CRMS Admin</Text>
            </View>
          </View>
        </View>
      </View>

      {/* User Info Section */}
      <View style={styles.userInfoSection}>
        <View style={styles.userInfoContent}>
          <View style={styles.userInfoLeft}>
            <View style={styles.roleIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="white" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{getUserDisplayName(currentUser)}</Text>
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
              <View style={styles.menuRoleIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color="white" />
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
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSystemSettings}>
              <Ionicons name="settings-outline" size={20} color="#353A40" />
              <Text style={styles.menuItemText}>System Settings</Text>
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
        {/* Admin Features - Organized by Functionality */}
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

        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="people-outline" size={20} color="white" />
              </View>
              <Text style={styles.statValue}>150+</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="school-outline" size={20} color="white" />
              </View>
              <Text style={styles.statValue}>45</Text>
              <Text style={styles.statLabel}>Faculty Members</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="time-outline" size={20} color="white" />
              </View>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Pending Approvals</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              </View>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>System Uptime</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Account Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Create {selectedRole ? getRoleDisplayName(selectedRole) : ''} Account
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({...formData, firstName: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({...formData, lastName: text})}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.input}
                  value={formData.department}
                  onChangeText={(text) => setFormData({...formData, department: text})}
                  placeholder="Enter department"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Position</Text>
                <TextInput
                  style={styles.input}
                  value={formData.position}
                  onChangeText={(text) => setFormData({...formData, position: text})}
                  placeholder="Enter position"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitCreate}>
                <Text style={styles.submitButtonText}>Create Account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Faculty Approval Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Faculty Approval Requests</Text>
              <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.approvalContainer}>
              {pendingFacultyAccounts.map((faculty) => (
                <View key={faculty.id} style={styles.approvalCard}>
                  <View style={styles.facultyInfo}>
                    <Text style={styles.facultyName}>{faculty.firstName} {faculty.lastName}</Text>
                    <Text style={styles.facultyEmail}>{faculty.email}</Text>
                    <Text style={styles.facultyDepartment}>{faculty.department}</Text>
                    <Text style={styles.facultySpecialization}>{faculty.specialization}</Text>
                    <Text style={styles.facultyRank}>Academic Rank: {faculty.academicRank}</Text>
                    <Text style={styles.facultyPhone}>Phone: {faculty.phoneNumber}</Text>
                    <Text style={styles.requestDate}>Requested: {faculty.dateRequested}</Text>
                  </View>
                  <View style={styles.approvalButtons}>
                    <TouchableOpacity 
                      style={[styles.approvalButton, styles.approveButton]}
                      onPress={() => handleApproveFaculty(faculty.id)}
                    >
                      <Ionicons name="checkmark" size={16} color="white" />
                      <Text style={styles.approvalButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.approvalButton, styles.rejectButton]}
                      onPress={() => handleRejectFaculty(faculty.id)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                      <Text style={styles.approvalButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Management Modal */}
      <Modal
        visible={showUserManagementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserManagementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Management</Text>
              <TouchableOpacity onPress={() => setShowUserManagementModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Filter by:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('all')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('active')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'active' && styles.filterButtonTextActive]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('pending')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'inactive' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('inactive')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'inactive' && styles.filterButtonTextActive]}>Inactive</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'faculty' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('faculty')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'faculty' && styles.filterButtonTextActive]}>Faculty</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'dean' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('dean')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'dean' && styles.filterButtonTextActive]}>Dean</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'program-chair' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('program-chair')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'program-chair' && styles.filterButtonTextActive]}>Program Chair</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, selectedFilter === 'staff' && styles.filterButtonActive]}
                  onPress={() => handleFilterUsers('staff')}
                >
                  <Text style={[styles.filterButtonText, selectedFilter === 'staff' && styles.filterButtonTextActive]}>Staff</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* User List */}
            <ScrollView style={styles.userListContainer}>
              {filteredUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: user.status === 'active' ? '#10B981' : user.status === 'pending' ? '#F59E0B' : '#EF4444' }]}>
                        <Text style={styles.statusText}>{user.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userDetails}>
                      <Text style={styles.userRole}>{getRoleDisplayName(user.role)}</Text>
                      <Text style={styles.userDepartment}>• {user.department}</Text>
                      {user.lastLogin && (
                        <Text style={styles.lastLogin}>• Last login: {user.lastLogin}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => Alert.alert('Edit User', 'Edit user functionality - Coming Soon!')}
                    >
                      <Ionicons name="create-outline" size={16} color="#6B7280" />
                    </TouchableOpacity>
                    {user.status === 'active' ? (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deactivateButton]}
                        onPress={() => handleUserAction(user.id, 'deactivate')}
                      >
                        <Ionicons name="pause-outline" size={16} color="#F59E0B" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.activateButton]}
                        onPress={() => handleUserAction(user.id, 'activate')}
                      >
                        <Ionicons name="play-outline" size={16} color="#10B981" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleUserAction(user.id, 'delete')}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  userDetails: {
    alignItems: 'flex-start',
    marginLeft: 12,
    flexDirection: 'column',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    textAlign: 'left',
    letterSpacing: -0.3,
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 1,
    fontWeight: '500',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'left',
    fontWeight: '400',
  },
  profileButton: {
    padding: 10,
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
  logoutButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#353A40',
    textAlign: 'center',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  formContainer: {
    flex: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  approvalContainer: {
    flex: 1,
  },
  approvalCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  facultyInfo: {
    marginBottom: 12,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  facultyEmail: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  facultyDepartment: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  facultySpecialization: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  facultyRank: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  facultyPhone: {
    fontSize: 14,
    color: '#353A40',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approvalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approvalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F9FAFB',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  userListContainer: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userRole: {
    fontSize: 13,
    color: '#353A40',
    fontWeight: '500',
  },
  userDepartment: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  lastLogin: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  editButton: {
    backgroundColor: '#F9FAFB',
  },
  deactivateButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  activateButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuUserDetails: {
    flex: 1,
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  menuUserRole: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuItemText: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  menuFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutMenuItemText: {
    fontSize: 15,
    color: '#DC2626',
    marginLeft: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
}); 