import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function SlideshowPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const students = params.students ? JSON.parse(params.students) : [];
  const initialIndex = params.initialIndex ? Number(params.initialIndex) : 0;
  const flatListRef = useRef(null);

  // Scroll to initial index on mount
  React.useEffect(() => {
    if (flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
      }, 0);
    }
  }, [initialIndex]);

  const CARD_WIDTH = Math.round(Dimensions.get('window').width * 0.8);
  const CARD_MARGIN = Math.round((Dimensions.get('window').width - CARD_WIDTH) / 2);

  const renderStudent = ({ item }) => (
    <View style={[styles.studentCard, { width: CARD_WIDTH, marginHorizontal: 8 }]}> 
      <Text style={styles.detailName}>{item.full_name || item.name}</Text>
      <Text style={styles.detailId}>{item.student_number || item.studentId}</Text>
      {/* Add more details as needed */}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            const { selectedClassId, selectedSessionId } = params;
            if (selectedClassId && selectedSessionId) {
              router.replace({
                pathname: '/users/faculty/AttendanceManagement',
                params: {
                  selectedClassId,
                  selectedSessionId,
                },
              });
            } else {
              router.replace('/users/faculty/AttendanceManagement');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#dc2626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Slideshow</Text>
      </View>

      {/* Vertically centered carousel */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <FlatList
          ref={flatListRef}
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item, idx) => String(item.student_id || item.id || idx)}
          horizontal
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          snapToAlignment="center"
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: CARD_WIDTH + 16, offset: (CARD_WIDTH + 16) * index, index })}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: CARD_MARGIN }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    flex: 1,
  },
  detailsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  studentCard: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 200,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  detailId: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default SlideshowPage; 