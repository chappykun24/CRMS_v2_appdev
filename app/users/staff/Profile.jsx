import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../../../contexts/UserContext';
import ProfileHeader from '../../components/ProfileHeader';

export default function StaffProfileScreen() {
  const { currentUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || 'Ana',
    lastName: currentUser?.lastName || 'Reyes',
    email: currentUser?.email || 'ana.reyes@university.edu',
    phone: currentUser?.phone || '+63 912 345 6789',
    position: currentUser?.position || 'Registrar Staff',
    department: currentUser?.department || 'Registrar Office',
    officeLocation: currentUser?.officeLocation || 'Room 201, Admin Building',
    officeHours: currentUser?.officeHours || 'Monday-Friday 8:00-5:00 PM'
  });

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  const handleSaveProfile = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setProfileData({
      firstName: currentUser?.firstName || 'Ana',
      lastName: currentUser?.lastName || 'Reyes',
      email: currentUser?.email || 'ana.reyes@university.edu',
      phone: currentUser?.phone || '+63 912 345 6789',
      position: currentUser?.position || 'Registrar Staff',
      department: currentUser?.department || 'Registrar Office',
      officeLocation: currentUser?.officeLocation || 'Room 201, Admin Building',
      officeHours: currentUser?.officeHours || 'Monday-Friday 8:00-5:00 PM'
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality will be implemented here.');
  };



  const handleEditToggle = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      setIsEditing(true);
    }
  };

  const renderProfileSection = (title, icon, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#DC2626" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderInputField = (label, value, key, placeholder, keyboardType = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={(text) => setProfileData({ ...profileData, [key]: text })}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#9CA3AF"
        />
      ) : (
        <Text style={styles.displayValue}>{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader
        title="Profile"
        onEdit={handleEditToggle}
        isEditing={isEditing}
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePicture}>
            <Ionicons name="person" size={60} color="#9CA3AF" />
          </View>
          <Text style={styles.profileName}>
            {profileData.firstName} {profileData.lastName}
          </Text>
          <Text style={styles.profileRole}>Registrar Staff</Text>
        </View>

        {/* Personal Information */}
        {renderProfileSection('Personal Information', 'person-outline',
          <View style={styles.sectionContent}>
            {renderInputField('First Name', profileData.firstName, 'firstName', 'Enter first name')}
            {renderInputField('Last Name', profileData.lastName, 'lastName', 'Enter last name')}
            {renderInputField('Email', profileData.email, 'email', 'Enter email', 'email-address')}
            {renderInputField('Phone', profileData.phone, 'phone', 'Enter phone number', 'phone-pad')}
          </View>
        )}

        {/* Professional Information */}
        {renderProfileSection('Professional Information', 'briefcase-outline',
          <View style={styles.sectionContent}>
            {renderInputField('Position', profileData.position, 'position', 'Enter position')}
            {renderInputField('Department', profileData.department, 'department', 'Enter department')}
            {renderInputField('Office Location', profileData.officeLocation, 'officeLocation', 'Enter office location')}
            {renderInputField('Office Hours', profileData.officeHours, 'officeHours', 'Enter office hours')}
          </View>
        )}

        {/* Actions */}
        {renderProfileSection('Account Settings', 'settings-outline',
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
              <Ionicons name="lock-closed-outline" size={20} color="#DC2626" />
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            

          </View>
        )}

        {/* Save Button */}
        {isEditing && (
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40, // Add extra padding at bottom for better scrolling
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginLeft: 8,
  },
  sectionContent: {
    // No specific styles needed here, content will be handled by renderInputField
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  inputField: {
    fontSize: 16,
    color: '#353A40',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  displayValue: {
    fontSize: 16,
    color: '#353A40',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    flex: 1,
    textAlign: 'left',
  },
  saveButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#353A40',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 