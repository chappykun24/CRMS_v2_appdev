import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function CourseManagementScreen() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('departments');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  if (!currentUser) {
    router.replace('/');
    return null;
  }

  // Sample data - in real app, this would come from API
  const departments = [
    {
      id: 1,
      name: 'College of Computer Studies',
      abbreviation: 'CCS',
      programs: 3,
      faculty: 15
    },
    {
      id: 2,
      name: 'College of Engineering',
      abbreviation: 'COE',
      programs: 4,
      faculty: 20
    },
    {
      id: 3,
      name: 'College of Arts and Sciences',
      abbreviation: 'CAS',
      programs: 5,
      faculty: 25
    }
  ];

  const programs = [
    {
      id: 1,
      name: 'Bachelor of Science in Computer Science',
      abbreviation: 'BSCS',
      department: 'College of Computer Studies',
      description: 'A comprehensive program covering computer science fundamentals',
      specializations: 2,
      courses: 45
    },
    {
      id: 2,
      name: 'Bachelor of Science in Information Technology',
      abbreviation: 'BSIT',
      department: 'College of Computer Studies',
      description: 'Focus on information technology and systems',
      specializations: 3,
      courses: 42
    },
    {
      id: 3,
      name: 'Bachelor of Science in Civil Engineering',
      abbreviation: 'BSCE',
      department: 'College of Engineering',
      description: 'Civil engineering and infrastructure development',
      specializations: 2,
      courses: 48
    }
  ];

  const specializations = [
    {
      id: 1,
      name: 'Software Engineering',
      abbreviation: 'SE',
      program: 'Bachelor of Science in Computer Science',
      description: 'Focus on software development and engineering principles',
      courses: 15
    },
    {
      id: 2,
      name: 'Data Science',
      abbreviation: 'DS',
      program: 'Bachelor of Science in Computer Science',
      description: 'Data analysis, machine learning, and statistical computing',
      courses: 12
    },
    {
      id: 3,
      name: 'Web Development',
      abbreviation: 'WD',
      program: 'Bachelor of Science in Information Technology',
      description: 'Web technologies and application development',
      courses: 18
    }
  ];

  const courses = [
    {
      id: 1,
      title: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Fundamental concepts of computer science and programming',
      units: 3,
      specialization: 'Software Engineering',
      term: '2024-2025 1st Semester',
      instructor: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      title: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'Advanced programming concepts and algorithm design',
      units: 4,
      specialization: 'Software Engineering',
      term: '2024-2025 1st Semester',
      instructor: 'Dr. Michael Chen'
    },
    {
      id: 3,
      title: 'Database Management Systems',
      code: 'IT301',
      description: 'Database design, implementation, and management',
      units: 3,
      specialization: 'Web Development',
      term: '2024-2025 1st Semester',
      instructor: 'Prof. Emily Davis'
    }
  ];

  const getTabData = () => {
    switch (activeTab) {
      case 'departments':
        return departments;
      case 'programs':
        return programs;
      case 'specializations':
        return specializations;
      case 'courses':
        return courses;
      default:
        return [];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'departments':
        return 'Departments';
      case 'programs':
        return 'Programs';
      case 'specializations':
        return 'Specializations';
      case 'courses':
        return 'Courses';
      default:
        return '';
    }
  };

  const handleAdd = () => {
    setFormData({});
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Confirmation',
      `Are you sure you want to delete this ${activeTab.slice(0, -1)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', `${activeTab.slice(0, -1)} deleted successfully!`);
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (showEditModal) {
      Alert.alert('Success', `${activeTab.slice(0, -1)} updated successfully!`);
      setShowEditModal(false);
    } else {
      Alert.alert('Success', `${activeTab.slice(0, -1)} created successfully!`);
      setShowAddModal(false);
    }
    setFormData({});
  };

  const renderTabButton = (tab, label, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={activeTab === tab ? '#DC2626' : '#6B7280'} 
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDepartmentCard = (dept) => (
    <View key={dept.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{dept.name}</Text>
          <Text style={styles.cardSubtitle}>{dept.abbreviation}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(dept)}>
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(dept)}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dept.programs}</Text>
          <Text style={styles.statLabel}>Programs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{dept.faculty}</Text>
          <Text style={styles.statLabel}>Faculty</Text>
        </View>
      </View>
    </View>
  );

  const renderProgramCard = (program) => (
    <View key={program.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{program.name}</Text>
          <Text style={styles.cardSubtitle}>{program.abbreviation}</Text>
          <Text style={styles.cardDepartment}>{program.department}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(program)}>
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(program)}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDescription}>{program.description}</Text>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{program.specializations}</Text>
          <Text style={styles.statLabel}>Specializations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{program.courses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>
    </View>
  );

  const renderSpecializationCard = (spec) => (
    <View key={spec.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{spec.name}</Text>
          <Text style={styles.cardSubtitle}>{spec.abbreviation}</Text>
          <Text style={styles.cardDepartment}>{spec.program}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(spec)}>
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(spec)}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDescription}>{spec.description}</Text>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{spec.courses}</Text>
          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>
    </View>
  );

  const renderCourseCard = (course) => (
    <View key={course.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{course.title}</Text>
          <Text style={styles.cardSubtitle}>{course.code}</Text>
          <Text style={styles.cardDepartment}>{course.specialization}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(course)}>
            <Ionicons name="pencil" size={16} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(course)}>
            <Ionicons name="trash" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDescription}>{course.description}</Text>
      <View style={styles.cardStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{course.units}</Text>
          <Text style={styles.statLabel}>Units</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{course.term}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{course.instructor}</Text>
        </View>
      </View>
    </View>
  );

  const renderCard = (item) => {
    switch (activeTab) {
      case 'departments':
        return renderDepartmentCard(item);
      case 'programs':
        return renderProgramCard(item);
      case 'specializations':
        return renderSpecializationCard(item);
      case 'courses':
        return renderCourseCard(item);
      default:
        return null;
    }
  };

  const renderFormModal = () => (
    <Modal
      visible={showAddModal || showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        setShowEditModal(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showEditModal ? 'Edit' : 'Add'} {getTabTitle().slice(0, -1)}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowAddModal(false);
              setShowEditModal(false);
            }}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {activeTab === 'departments' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Department Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name || ''}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter department name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Abbreviation *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.abbreviation || ''}
                    onChangeText={(text) => setFormData({...formData, abbreviation: text})}
                    placeholder="e.g., CCS, COE"
                  />
                </View>
              </>
            )}

            {activeTab === 'programs' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Program Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name || ''}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter program name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Abbreviation *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.abbreviation || ''}
                    onChangeText={(text) => setFormData({...formData, abbreviation: text})}
                    placeholder="e.g., BSCS, BSIT"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Department *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.department || ''}
                    onChangeText={(text) => setFormData({...formData, department: text})}
                    placeholder="Select department"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter program description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {activeTab === 'specializations' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specialization Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name || ''}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter specialization name"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Abbreviation *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.abbreviation || ''}
                    onChangeText={(text) => setFormData({...formData, abbreviation: text})}
                    placeholder="e.g., SE, DS"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Program *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.program || ''}
                    onChangeText={(text) => setFormData({...formData, program: text})}
                    placeholder="Select program"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter specialization description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            {activeTab === 'courses' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Course Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.title || ''}
                    onChangeText={(text) => setFormData({...formData, title: text})}
                    placeholder="Enter course title"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Course Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.code || ''}
                    onChangeText={(text) => setFormData({...formData, code: text})}
                    placeholder="e.g., CS101, MATH201"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Units *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.units || ''}
                    onChangeText={(text) => setFormData({...formData, units: text})}
                    placeholder="e.g., 3"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specialization *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.specialization || ''}
                    onChangeText={(text) => setFormData({...formData, specialization: text})}
                    placeholder="Select specialization"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({...formData, description: text})}
                    placeholder="Enter course description"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {showEditModal ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#353A40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Management</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {renderTabButton('departments', 'Departments', 'business')}
        {renderTabButton('programs', 'Programs', 'school')}
        {renderTabButton('specializations', 'Specializations', 'library')}
        {renderTabButton('courses', 'Courses', 'book')}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getTabTitle()}</Text>
          <Text style={styles.sectionSubtitle}>
            Manage {getTabTitle().toLowerCase()} and their configurations
          </Text>
        </View>

        {getTabData().map((item) => renderCard(item))}
      </ScrollView>

      {renderFormModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  addButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FEF2F2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#DC2626',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  cardDepartment: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  formContainer: {
    flex: 1,
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
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
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