import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserRole } from '../../../types/userRoles';
import { ROUTES } from '../../../utils/routes';

export default function RoleSelection() {
  const roles = [
    {
      id: UserRole.FACULTY,
      title: 'Faculty',
      description: 'Manage grades, attendance, and syllabi',
      icon: 'person-outline',
      color: '#DC2626',
      route: ROUTES.LOGIN
    },
    {
      id: UserRole.STAFF,
      title: 'Staff',
      description: 'Encode student information and records',
      icon: 'people-outline',
      color: '#059669',
      route: ROUTES.LOGIN
    },
    {
      id: UserRole.PROGRAM_CHAIR,
      title: 'Program Chair',
      description: 'Configure subjects and programs',
      icon: 'business-outline',
      color: '#7C3AED',
      route: ROUTES.LOGIN
    },
    {
      id: UserRole.DEAN,
      title: 'Dean',
      description: 'Approve syllabi and view analytics',
      icon: 'shield-outline',
      color: '#1F2937',
      route: ROUTES.LOGIN
    },
    {
      id: UserRole.ADMIN,
      title: 'Administrator',
      description: 'Full system access and management',
      icon: 'settings-outline',
      color: '#DC2626',
      route: ROUTES.LOGIN
    }
  ];

  const handleRoleSelect = (role) => {
    // Navigate to login page
    router.push(role.route);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: 80 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose the role that best describes your position</Text>
      </View>
      
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, { borderLeftColor: role.color }]}
            onPress={() => handleRoleSelect(role)}
          >
            <View style={styles.roleContent}>
              <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
                <Ionicons name={role.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    // This style is not defined in the original file, but is added by the edit.
    // It's included here to make the new code valid.
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  rolesContainer: {
    padding: 20,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
}); 