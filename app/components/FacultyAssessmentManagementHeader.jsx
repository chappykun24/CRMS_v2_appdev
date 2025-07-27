import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FacultyAssessmentManagementHeader({ 
  currentView,
  selectedClass,
  selectedAssessment,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
  onBackNavigation
}) {
  const handleBack = () => {
    onBackNavigation();
  };

  const getTitle = () => {
    if (currentView === 'classes') return 'Assessment Management';
    if (currentView === 'classDetails') return `${selectedClass?.courseCode} - Assessments`;
    if (currentView === 'assessmentDetails') return selectedAssessment?.title;
    return 'Assessment Management';
  };

  const getSubtitle = () => {
    if (currentView === 'classes') return 'Manage your course assessments';
    if (currentView === 'classDetails') return `${selectedClass?.courseTitle}`;
    if (currentView === 'assessmentDetails') return `${selectedClass?.courseCode} - ${selectedAssessment?.type}`;
    return '';
  };

  const renderSearchBar = () => {
    if ((currentView === 'classDetails' || currentView === 'assessmentDetails') && showSearch) {
      return (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={currentView === 'classDetails' ? "Search assessments..." : "Search students by name or ID..."}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{getTitle()}</Text>
            {getSubtitle() && <Text style={styles.subtitle}>{getSubtitle()}</Text>}
          </View>
        </View>
        <View style={styles.headerButtons}>
          {currentView === 'classDetails' && (
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={20} color="#dc2626" />
            </TouchableOpacity>
          )}
          
          {currentView === 'assessmentDetails' && (
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? 'close-outline' : 'search-outline'} size={20} color="#dc2626" />
            </TouchableOpacity>
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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