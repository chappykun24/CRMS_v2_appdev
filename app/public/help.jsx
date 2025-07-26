import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Help() {
  const [selectedModal, setSelectedModal] = useState(null);

  const helpSections = [
    {
      title: 'Getting Started',
      icon: 'rocket-outline',
      items: [
        {
          title: 'How to create an account',
          content: 'To create a faculty account, navigate to the Faculty Registration page and fill out the required information including your personal details, academic information, and upload an optional profile photo. Once submitted, your application will be reviewed by the administrator and you will receive an email notification upon approval.'
        },
        {
          title: 'Understanding your role',
          content: 'Faculty members can manage their classes, create syllabi, take attendance, manage grades, and view student information. Each role has specific permissions and access levels within the system.'
        },
        {
          title: 'First time setup guide',
          content: 'After your account is approved, log in with your credentials. Complete your profile information, set up your department preferences, and familiarize yourself with the dashboard layout and navigation options.'
        }
      ]
    },
    {
      title: 'Navigation',
      icon: 'compass-outline',
      items: [
        {
          title: 'Using the bottom navigation',
          content: 'The bottom navigation bar provides quick access to different sections of the app. Tap on the icons to switch between Dashboard, My Classes, My Syllabi, and Profile sections. The active section will be highlighted in red.'
        },
        {
          title: 'Accessing different sections',
          content: 'Each section contains specific functionality: Dashboard shows overview and quick actions, My Classes displays your assigned courses, My Syllabi shows your syllabus management tools, and Profile contains your account settings and information.'
        },
        {
          title: 'Understanding the interface',
          content: 'The interface uses a clean, modern design with consistent styling. Red accents indicate primary actions, gray elements are secondary, and white backgrounds provide good contrast for readability.'
        }
      ]
    },
    {
      title: 'Common Issues',
      icon: 'warning-outline',
      items: [
        {
          title: 'Login problems',
          content: 'If you cannot log in, ensure your email and password are correct. Check that your account has been approved by the administrator. If you forgot your password, contact the system administrator for assistance.'
        },
        {
          title: 'Password reset',
          content: 'Currently, password resets must be handled by the system administrator. Contact the IT department or your department head to request a password reset. Include your full name and email address in the request.'
        },
        {
          title: 'Account access issues',
          content: 'If you cannot access certain features, verify that your account has the correct role permissions. Contact the administrator if you believe your access level is incorrect or if you need additional permissions.'
        }
      ]
    },
    {
      title: 'Contact Support',
      icon: 'call-outline',
      items: [
        {
          title: 'Email support',
          content: 'For technical support, email support@batstateu.edu.ph with a detailed description of your issue. Include your name, role, and any error messages you encounter. Response time is typically within 24 hours.'
        },
        {
          title: 'Phone support',
          content: 'For urgent issues, call the IT department at (043) 702-1234 during business hours (8:00 AM - 5:00 PM, Monday to Friday). Have your account information ready when calling.'
        },
        {
          title: 'Live chat (coming soon)',
          content: 'Live chat support will be available soon for real-time assistance. This feature will allow you to chat directly with support staff for immediate help with common issues and questions.'
        }
      ]
    }
  ];

  const openModal = (sectionIndex, itemIndex) => {
    setSelectedModal({ sectionIndex, itemIndex });
  };

  const closeModal = () => {
    setSelectedModal(null);
  };

  const getModalContent = () => {
    if (!selectedModal) return null;
    const { sectionIndex, itemIndex } = selectedModal;
    return helpSections[sectionIndex].items[itemIndex];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <View style={styles.content}>
        {helpSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon} size={24} color="#DC2626" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity key={itemIndex} style={styles.helpItem} onPress={() => openModal(sectionIndex, itemIndex)}>
                <Text style={styles.helpItemText}>• {item.title}</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Need more help? Contact our support team at support@batstateu.edu.ph
        </Text>
      </View>

      <Modal
        visible={selectedModal !== null}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color="#353A40" />
          </TouchableOpacity>
          {getModalContent() && (
            <View style={styles.modalItem}>
              <Text style={styles.modalItemTitle}>{getModalContent().title}</Text>
              <Text style={styles.modalItemContent}>{getModalContent().content}</Text>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginLeft: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  helpItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  modalItem: {
    marginBottom: 20,
  },
  modalItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 10,
  },
  modalItemContent: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
}); 