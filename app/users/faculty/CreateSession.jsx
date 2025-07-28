import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../../utils/api';
import FacultyCreateSessionHeader from '../../components/FacultyCreateSessionHeader';

export default function CreateSessionScreen() {
  const params = useLocalSearchParams();
  const [date, setDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');

  const handleCreate = async () => {
    if (!date || !title) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    try {
      await apiClient.post(`/section-courses/${params.section_course_id}/sessions`, {
        date,
        title,
        type,
      });
      Alert.alert('Success', 'Session created!');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to create session');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Format as YYYY-MM-DD
      const iso = selectedDate.toISOString();
      setDate(iso.slice(0, 10));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FacultyCreateSessionHeader />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        alwaysBounceVertical={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.headerSection}>
            <Ionicons name="calendar-outline" size={32} color="#DC2626" style={styles.headerIcon} />
            <Text style={styles.sectionTitle}>Create New Session</Text>
            <Text style={styles.sectionSubtitle}>Fill in the details below to create a new session for your class</Text>
          </View>
          
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Session Title</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TextInput
                placeholder="Enter a descriptive title for this session"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
              <Text style={styles.helperText}>This will help students identify the session content</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Session Date</Text>
                <Text style={styles.required}>*</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.datePickerButton, date && styles.datePickerButtonSelected]}
              >
                <View style={styles.datePickerContent}>
                  <Ionicons name="calendar-outline" size={20} color={date ? "#DC2626" : "#6B7280"} />
                  <Text style={[styles.datePickerText, !date && styles.placeholderText]}>
                    {date ? formatDate(date) : 'Select a date for this session'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.helperText}>Choose when this session will take place</Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Session Type</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                placeholder="e.g., Lecture, Lab, Discussion, Quiz, Exam"
                value={type}
                onChangeText={setType}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
              <Text style={styles.helperText}>Specify the type of session to help with organization</Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Session Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Title:</Text>
                <Text style={styles.summaryValue}>{title || 'Not specified'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{date ? formatDate(date) : 'Not selected'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Type:</Text>
                <Text style={styles.summaryValue}>{type || 'Not specified'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.createButton, (!date || !title) && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={!date || !title}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.createButtonText}>Create Session</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased padding for better bottom spacing
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIcon: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
  },
  required: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 4,
  },
  optional: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#353A40',
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  datePickerButtonSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerText: {
    fontSize: 16,
    color: '#353A40',
    marginLeft: 12,
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 60,
  },
  summaryValue: {
    fontSize: 14,
    color: '#353A40',
    flex: 1,
  },
  createButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 