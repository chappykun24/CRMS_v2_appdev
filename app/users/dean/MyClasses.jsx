import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useModal } from '../../../utils/useModal';
import DeanClassesHeader from '../../components/DeanClassesHeader';

// Class Card Component
const ClassCard = ({ cls, onCardPress }) => {
  return (
    <ClickableContainer style={styles.classCard} onPress={() => onCardPress(cls)}>
      <View style={styles.classHeader}>
        <View style={styles.classAvatar}>
          <Text style={styles.avatarText}>{cls.courseCode.charAt(0)}</Text>
        </View>
        <View style={styles.classInfoSection}>
          <Text style={styles.classTitle}>{cls.courseCode} - {cls.courseTitle}</Text>
          <Text style={styles.classSchedule}><Ionicons name="calendar-outline" size={14} color="#6B7280" /> {cls.schedule}</Text>
          <Text style={styles.facultyText}><Ionicons name="person-outline" size={14} color="#6B7280" /> {cls.faculty}</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="people-outline" size={16} color="#DC2626" style={{ marginRight: 2 }} />
          <Text style={styles.studentCountText}>{cls.students.length} students</Text>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.expandIcon} />
        </View>
      </View>
    </ClickableContainer>
  );
};

export default function DeanMyClassesScreen() {
  // Mock data for demonstration
  const [isTableView, setIsTableView] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showContainers, setShowContainers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { visible, selectedItem: selectedClass, openModal, closeModal } = useModal();
  
  const classes = [
    {
      id: 'class-001',
      courseCode: 'CS101',
      courseTitle: 'Introduction to Computer Science',
      schedule: 'MWF 9:00-10:30 AM',
      faculty: 'Dr. John Doe',
      room: 'Room 301, Engineering Building',
      credits: 3,
      semester: 'Fall 2024',
      students: [
        { id: 'stu-001', name: 'Alice Smith', email: 'alice.smith@university.edu', studentId: '2024-001' },
        { id: 'stu-002', name: 'Bob Johnson', email: 'bob.johnson@university.edu', studentId: '2024-002' },
        { id: 'stu-003', name: 'Charlie Brown', email: 'charlie.brown@university.edu', studentId: '2024-003' },
      ]
    },
    {
      id: 'class-002',
      courseCode: 'MATH201',
      courseTitle: 'Calculus I',
      schedule: 'TTh 10:00-11:30 AM',
      faculty: 'Dr. Jane Smith',
      room: 'Room 205, Science Building',
      credits: 4,
      semester: 'Fall 2024',
      students: [
        { id: 'stu-004', name: 'David Lee', email: 'david.lee@university.edu', studentId: '2024-004' },
        { id: 'stu-005', name: 'Eva Green', email: 'eva.green@university.edu', studentId: '2024-005' },
      ]
    },
    {
      id: 'class-003',
      courseCode: 'ENG101',
      courseTitle: 'English Composition',
      schedule: 'MWF 11:00-12:30 PM',
      faculty: 'Dr. Michael Johnson',
      room: 'Room 102, Humanities Building',
      credits: 3,
      semester: 'Fall 2024',
      students: [
        { id: 'stu-006', name: 'Fiona White', email: 'fiona.white@university.edu', studentId: '2024-006' },
        { id: 'stu-007', name: 'George Black', email: 'george.black@university.edu', studentId: '2024-007' },
        { id: 'stu-008', name: 'Hannah Blue', email: 'hannah.blue@university.edu', studentId: '2024-008' },
        { id: 'stu-009', name: 'Ian Red', email: 'ian.red@university.edu', studentId: '2024-009' },
      ]
    }
  ];

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls => {
    if (!searchTerm) return true;
    return cls.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cls.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cls.faculty.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Find selected class for table view
  const selectedClassForTable = filteredClasses.find(cls => cls.id === selectedClassId) || filteredClasses[0];

  const handleSearch = () => {
    // Search functionality can be implemented here
    console.log('Searching for:', searchTerm);
  };

  const handleCardPress = (cls) => {
    openModal(cls);
  };

  const renderClassModal = () => {
    if (!selectedClass) return null;

    const modalFooter = (
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalViewButton]}
          onPress={() => {
            console.log('View class details:', selectedClass.id);
            closeModal();
          }}
        >
          <Ionicons name="eye-outline" size={16} color="#DC2626" />
          <Text style={styles.modalViewButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalEditButton]}
          onPress={() => {
            console.log('Edit class:', selectedClass.id);
            closeModal();
          }}
        >
          <Ionicons name="create-outline" size={16} color="#10B981" />
          <Text style={styles.modalEditButtonText}>Edit Class</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <ModalContainer
        visible={visible}
        onClose={closeModal}
        title="Class Details"
        footer={modalFooter}
      >
        <View style={styles.modalContent}>
          {/* Class Header */}
          <View style={styles.modalClassHeader}>
            <View style={styles.modalClassAvatar}>
              <Text style={styles.modalAvatarText}>{selectedClass.courseCode.charAt(0)}</Text>
            </View>
            <View style={styles.modalClassInfo}>
              <Text style={styles.modalClassCode}>{selectedClass.courseCode}</Text>
              <Text style={styles.modalClassTitle}>{selectedClass.courseTitle}</Text>
              <View style={styles.modalClassBadge}>
                <Text style={styles.modalClassBadgeText}>{selectedClass.credits} Credits</Text>
              </View>
            </View>
          </View>

          {/* Class Details */}
          <View style={styles.modalDetails}>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Schedule:</Text>
                <Text style={styles.modalDetailValue}>{selectedClass.schedule}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="person-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Faculty:</Text>
                <Text style={styles.modalDetailValue}>{selectedClass.faculty}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Room:</Text>
                <Text style={styles.modalDetailValue}>{selectedClass.room}</Text>
              </View>
            </View>
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="school-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
                <Text style={styles.modalDetailLabel}>Semester:</Text>
                <Text style={styles.modalDetailValue}>{selectedClass.semester}</Text>
              </View>
            </View>
          </View>

          {/* Students List */}
          <View style={styles.modalStudents}>
            <Text style={styles.modalStudentsTitle}>Students ({selectedClass.students.length}):</Text>
            <View style={styles.modalStudentsList}>
              {selectedClass.students.map((student, index) => (
                <View key={student.id} style={styles.modalStudentItem}>
                  <View style={styles.modalStudentAvatar}>
                    <Text style={styles.modalStudentAvatarText}>{student.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.modalStudentInfo}>
                    <Text style={styles.modalStudentName}>{student.name}</Text>
                    <Text style={styles.modalStudentEmail}>{student.email}</Text>
                    <Text style={styles.modalStudentId}>ID: {student.studentId}</Text>
                  </View>
                  <Text style={styles.modalStudentNumber}>#{index + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ModalContainer>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DeanClassesHeader
        showContainers={showContainers}
        setShowContainers={setShowContainers}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
      />
      
      <View style={styles.content}>
        {/* Table View Dropdown */}
        {isTableView && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Select Class:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedClassForTable ? selectedClassForTable.id : ''}
                onValueChange={(itemValue) => setSelectedClassId(itemValue)}
                style={styles.picker}
              >
                {filteredClasses.map(cls => (
                  <Picker.Item key={cls.id} label={`${cls.courseCode} - ${cls.courseTitle}`} value={cls.id} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Classes List or Table View */}
        {isTableView ? (
          <View style={styles.tableViewContainer}>
            {selectedClassForTable && selectedClassForTable.students.length > 0 ? (
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 4 }]}>Student Name</Text>
                </View>
                {selectedClassForTable.students.map((stu, idx) => (
                  <View key={stu.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{idx + 1}</Text>
                    <Text style={[styles.tableCell, { flex: 4 }]}>{stu.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            )}
          </View>
        ) : (
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
            <View style={styles.classesList}>
              {filteredClasses.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="school-outline" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyText}>No classes found</Text>
                  <Text style={styles.emptySubtext}>No classes are available at this time.</Text>
                </View>
              ) : (
                filteredClasses.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    cls={cls}
                    onCardPress={handleCardPress}
                  />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
      {renderClassModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
  },
  classesList: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  classAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  classInfoSection: {
    flex: 1,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 2,
  },
  classSchedule: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  facultyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 10,
  },
  studentCountText: {
    fontSize: 13,
    color: '#353A40',
    marginLeft: 2,
    marginRight: 2,
  },
  expandIcon: {
    marginLeft: 2,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    zIndex: 2,
  },
  dropdownLabel: {
    fontSize: 15,
    color: '#353A40',
    marginRight: 8,
    fontWeight: '500',
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 36,
    width: '100%',
  },
  tableViewContainer: {
    flex: 1,
    paddingTop: 12,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 15,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    fontSize: 15,
    color: '#353A40',
  },
  // Modal Styles
  modalContent: {
    padding: 16,
  },
  modalClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalClassAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalClassInfo: {
    flex: 1,
  },
  modalClassCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 4,
  },
  modalClassTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalClassBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalClassBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailRow: {
    marginBottom: 8,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    width: 80,
    flexShrink: 0,
    marginLeft: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  modalStudents: {
    marginBottom: 20,
  },
  modalStudentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  modalStudentsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  modalStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalStudentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalStudentAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  modalStudentInfo: {
    flex: 1,
  },
  modalStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 2,
  },
  modalStudentEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  modalStudentId: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalStudentNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  modalViewButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  modalEditButton: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  modalViewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalEditButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
}); 