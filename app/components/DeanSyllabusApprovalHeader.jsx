import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DeanSyllabusApprovalHeader({ 
  showContainers, 
  setShowContainers, 
  isTableView, 
  setIsTableView, 
  searchTerm,
  setSearchTerm,
  onSearch
}) {
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#dc2626" />
          </TouchableOpacity>
          <Text style={styles.title}>Syllabus Approval</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setShowContainers(!showContainers)}
          >
            <Ionicons 
              name={showContainers ? "close" : "search"} 
              size={20} 
              color="#dc2626" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setIsTableView(v => !v)}
          >
            <Ionicons 
              name={isTableView ? 'grid' : 'list'} 
              size={20} 
              color="#dc2626" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {showContainers && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search syllabi..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={onSearch}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchButton}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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