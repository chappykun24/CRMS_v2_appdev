import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import apiClient from '../../../utils/api';

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

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Create New Session</Text>
      <TextInput
        placeholder="Session Title"
        value={title}
        onChangeText={setTitle}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 6 }}
      />
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 6 }}
      >
        <Text style={{ color: date ? '#222' : '#888' }}>{date || 'Select Date'}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date ? new Date(date) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
      <TextInput
        placeholder="Session Type (e.g., Lecture, Lab)"
        value={type}
        onChangeText={setType}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8, borderRadius: 6 }}
      />
      <Button title="Create Session" onPress={handleCreate} color="#dc2626" />
    </View>
  );
} 