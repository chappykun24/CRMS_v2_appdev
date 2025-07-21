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

export default function FacultyProfileScreen() {
  const { currentUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || 'Information Technology',
    position: currentUser?.position || 'Assistant Professor',
    officeLocation: currentUser?.officeLocation || 'Room 301, IT Building',
    officeHours: currentUser?.officeHours || 'MWF 2:00-4:00 PM'
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
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      department: currentUser?.department || 'Information Technology',
      position: currentUser?.position || 'Assistant Professor',
      officeLocation: currentUser?.officeLocation || 'Room 301, IT Building',
      officeHours: currentUser?.officeHours || 'MWF 2:00-4:00 PM'
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
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePicture}>
            <Ionicons name="person" size={60} color="#9CA3AF" />
          </View>
          <Text style={styles.profileName}>
            {currentUser?.firstName} {currentUser?.lastName}
          </Text>
          <Text style={styles.profileRole}>Faculty Member</Text>
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

        {/* Academic Information */}
        {renderProfileSection('Academic Information', 'school-outline',
          <View style={styles.sectionContent}>
            {renderInputField('Department', profileData.department, 'department', 'Enter department')}
            {renderInputField('Position', profileData.position, 'position', 'Enter position')}
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40, // Add extra padding at bottom for better scrolling
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#E5E7EB',
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  inputField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  displayValue: {
    fontSize: 16,
    color: '#353A40',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#353A40',
    flex: 1,
    marginLeft: 12,
  },
  saveButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 