import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FacultyAttendanceManagementHeader({ 
  currentView,
  selectedClass,
  selectedSession,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
  showSessionSearch,
  setShowSessionSearch,
  showStudentSearch,
  setShowStudentSearch,
  studentViewMode,
  setStudentViewMode,
  classSearchQuery,
  setClassSearchQuery,
  sessionSearchQuery,
  setSessionSearchQuery,
  studentSearchQuery,
  setStudentSearchQuery,
  onBackNavigation,
  onCreateNewSession,
  onCreateNewAttendance
}) {
  const handleBack = () => {
    onBackNavigation();
  };

  const getTitle = () => {
    if (currentView === 'classes') return 'Attendance Management';
    if (currentView === 'classDetails') return `${selectedClass?.course_code || ''} - ${selectedClass?.section_code || ''}`;
    if (currentView === 'sessionDetails') return selectedSession?.title;
    return 'Attendance Management';
  };

  const renderSearchBar = () => {
    if (currentView === 'classes' && showSearch) {
      return (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes..."
              placeholderTextColor="#9CA3AF"
              value={classSearchQuery}
              onChangeText={setClassSearchQuery}
            />
            {classSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setClassSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (currentView === 'classDetails' && showSessionSearch) {
      return (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions..."
              placeholderTextColor="#9CA3AF"
              value={sessionSearchQuery}
              onChangeText={setSessionSearchQuery}
            />
            {sessionSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSessionSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    if (currentView === 'sessionDetails' && showStudentSearch) {
      return (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor="#9CA3AF"
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
            />
            {studentSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setStudentSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#dc2626" />
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
        </View>
        <View style={styles.headerButtons}>
          {currentView === 'classes' && (
            <TouchableOpacity style={styles.toggleButton} onPress={() => setShowSearch((prev) => !prev)}>
              <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={20} color="#dc2626" />
            </TouchableOpacity>
          )}
          {currentView === 'classDetails' && (
            <>
              <TouchableOpacity style={styles.toggleButton} onPress={() => setShowSessionSearch((prev) => !prev)}>
                <Ionicons name={showSessionSearch ? 'close-outline' : 'search-outline'} size={20} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={onCreateNewSession}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
          {currentView === 'sessionDetails' && (
            <>
              <TouchableOpacity style={styles.toggleButton} onPress={() => setStudentViewMode(studentViewMode === 'card' ? 'table' : 'card')}>
                <Ionicons name={studentViewMode === 'card' ? 'list-outline' : 'grid-outline'} size={20} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.toggleButton} onPress={() => setShowStudentSearch((prev) => !prev)}>
                <Ionicons name={showStudentSearch ? 'close-outline' : 'search-outline'} size={20} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={onCreateNewAttendance}>
                <Ionicons name="images-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {renderSearchBar()}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#353A40',
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
}); 