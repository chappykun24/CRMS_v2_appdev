import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../../../utils/api';

export default function SessionListScreen() {
  const params = useLocalSearchParams();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (params.sessions) {
      setSessions(JSON.parse(params.sessions));
    } else if (params.section_course_id) {
      apiClient.get(`/section-courses/${params.section_course_id}/sessions`)
        .then(setSessions)
        .catch(() => setSessions([]));
    }
  }, [params]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
          Sessions for Class {params.section_course_id}
        </Text>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/users/faculty/CreateSession',
            params: { section_course_id: params.section_course_id }
          })}
          style={{
            backgroundColor: '#dc2626',
            borderRadius: 20,
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontSize: 16 }}>{item.title} - {item.date}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No sessions found for this class.</Text>}
      />
    </View>
  );
} 