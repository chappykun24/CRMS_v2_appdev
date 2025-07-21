import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useModal } from '../../../utils/useModal';
import StaffAssignFacultyHeader from '../../components/StaffAssignFacultyHeader';

// Mock data for classes with subject and section
const mockClassList = [
  {
    id: 1,
    subject: 'Introduction to Computer Science',
    code: 'CS101',
    section: 'BSIT 1101',
    currentFaculty: 'Dr. John Doe',
    credits: 3,
    schedule: 'MWF 9:00-10:30 AM',
    room: 'Room 301, Engineering Building',
    semester: 'Fall 2024',
    enrollment: 45,
    maxEnrollment: 50,
  },
  {
    id: 2,
    subject: 'Calculus I',
    code: 'MATH201',
    section: 'BSIT 2201',
    currentFaculty: 'Dr. Jane Smith',
    credits: 4,
    schedule: 'TTh 10:00-11:30 AM',
    room: 'Room 205, Science Building',
    semester: 'Fall 2024',
    enrollment: 38,
    maxEnrollment: 45,
  },
  {
    id: 3,
    subject: 'English Composition',
    code: 'ENG101',
    section: 'BSIT 1101',
    currentFaculty: 'Dr. Michael Johnson',
    credits: 3,
    schedule: 'MWF 11:00-12:30 PM',
    room: 'Room 102, Humanities Building',
    semester: 'Fall 2024',
    enrollment: 42,
    maxEnrollment: 50,
  },
];

const mockFaculty = [
  {
    id: 'F001',
    name: 'Dr. John Doe',
    email: 'john.doe@university.edu',
    phone: '+1 (555) 123-4567',
    department: 'Computer Science',
    position: 'Associate Professor',
    specialization: 'Software Engineering, Database Systems',
    yearsOfExperience: 8,
    education: 'Ph.D. Computer Science, Stanford University',
    officeLocation: 'Room 301, Engineering Building',
    officeHours: 'Mon/Wed 2:00-4:00 PM',
    currentLoad: 3,
    maxLoad: 4,
  },
  {
    id: 'F002',
    name: 'Dr. Jane Smith',
    email: 'jane.smith@university.edu',
    phone: '+1 (555) 234-5678',
    department: 'Mathematics',
    position: 'Assistant Professor',
    specialization: 'Calculus, Linear Algebra, Mathematical Analysis',
    yearsOfExperience: 5,
    education: 'Ph.D. Mathematics, MIT',
    officeLocation: 'Room 205, Science Building',
    officeHours: 'Tue/Thu 1:00-3:00 PM',
    currentLoad: 2,
    maxLoad: 4,
  },
  {
    id: 'F003',
    name: 'Dr. Michael Johnson',
    email: 'michael.johnson@university.edu',
    phone: '+1 (555) 345-6789',
    department: 'English',
    position: 'Professor',
    specialization: 'Creative Writing, Composition Studies',
    yearsOfExperience: 12,
    education: 'Ph.D. English Literature, Yale University',
    officeLocation: 'Room 102, Humanities Building',
    officeHours: 'Mon/Wed/Fri 10:00-12:00 AM',
    currentLoad: 4,
    maxLoad: 4,
  },
  {
    id: 'F004',
    name: 'Prof. Ana Reyes',
    email: 'ana.reyes@university.edu',
    phone: '+1 (555) 456-7890',
    department: 'Computer Science',
    position: 'Lecturer',
    specialization: 'Programming Fundamentals, Web Development',
    yearsOfExperience: 3,
    education: 'M.S. Computer Science, UC Berkeley',
    officeLocation: 'Room 201, Engineering Building',
    officeHours: 'Tue/Thu 3:00-5:00 PM',
    currentLoad: 2,
    maxLoad: 4,
  },
];

// Class Card Component
const ClassCard = ({ cls, currentFaculty, onCardPress }) => {
  return (
    <ClickableContainer style={styles.classContainer} onPress={() => onCardPress(cls, currentFaculty)}>
      <View style={styles.classHeader}>
        <Ionicons name="school-outline" size={28} color="#DC2626" style={{ marginRight: 10 }} />
        <View style={styles.classInfo}>
          <Text style={styles.classSubject}>{cls.subject} <Text style={styles.classCode}>({cls.code})</Text></Text>
          <Text style={styles.classSection}>Section: <Text style={styles.classSectionValue}>{cls.section}</Text></Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
      </View>
      <View style={styles.classDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Faculty:</Text>
          <Text style={styles.detailValue}>{currentFaculty}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Schedule:</Text>
          <Text style={styles.detailValue}>{cls.schedule}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Room:</Text>
          <Text style={styles.detailValue}>{cls.room}</Text>
        </View>
      </View>
    </ClickableContainer>
  );
};

export default function AssignFaculty() {
  // Track selected faculty for each class
  const [facultyAssignments, setFacultyAssignments] = useState(
    mockClassList.reduce((acc, cls) => {
      acc[cls.id] = cls.currentFaculty;
      return acc;
    }, {})
  );
  const [isTableView, setIsTableView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { visible, selectedItem: selectedClass, openModal, closeModal } = useModal();

  const handleAssign = (classId, facultyName) => {
    // Update the faculty assignment
    setFacultyAssignments((prev) => ({ ...prev, [classId]: facultyName }));
    console.log(`Assigned ${facultyName} to class ${classId}`);
    closeModal();
  };

  const handleCardPress = (cls, currentFaculty) => {
    openModal({ class: cls, currentFaculty });
  };

  // Filter classes by search
  const filteredClasses = mockClassList.filter(cls => {
    const q = searchQuery.toLowerCase();
    return (
      cls.subject.toLowerCase().includes(q) ||
      cls.code.toLowerCase().includes(q) ||
      cls.section.toLowerCase().includes(q) ||
      cls.currentFaculty.toLowerCase().includes(q)
    );
  });

  const renderAssignmentModal = () => {
    if (!selectedClass) return null;

    const { class: cls, currentFaculty } = selectedClass;
    const selectedFaculty = facultyAssignments[cls.id];

    const modalFooter = (
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalCancelButton]}
          onPress={closeModal}
        >
          <Text style={styles.modalCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, styles.modalAssignButton]}
          onPress={() => handleAssign(cls.id, selectedFaculty)}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
          <Text style={styles.modalAssignButtonText}>Assign Faculty</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <ModalContainer
        visible={visible}
        onClose={closeModal}
        title="Assign Faculty"
        footer={modalFooter}
      >
        <View style={styles.modalContent}>
          {/* Class Header */}
          <View style={styles.modalClassHeader}>
            <View style={styles.modalClassAvatar}>
              <Ionicons name="school-outline" size={32} color="#DC2626" />
            </View>
            <View style={styles.modalClassInfo}>
              <Text style={styles.modalClassCode}>{cls.code}</Text>
              <Text style={styles.modalClassTitle}>{cls.subject}</Text>
              <Text style={styles.modalClassSection}>{cls.section}</Text>
            </View>
          </View>

          {/* Class Details */}
          <View style={styles.modalClassDetails}>
            <Text style={styles.modalSectionTitle}>Class Information:</Text>
            <View style={styles.modalDetailGrid}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Schedule:</Text>
                <Text style={styles.modalDetailValue}>{cls.schedule}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Room:</Text>
                <Text style={styles.modalDetailValue}>{cls.room}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="school-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Credits:</Text>
                <Text style={styles.modalDetailValue}>{cls.credits}</Text>
              </View>
              <View style={styles.modalDetailItem}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.modalDetailLabel}>Enrollment:</Text>
                <Text style={styles.modalDetailValue}>{cls.enrollment}/{cls.maxEnrollment}</Text>
              </View>
            </View>
          </View>

          {/* Current Faculty */}
          <View style={styles.modalCurrentFaculty}>
            <Text style={styles.modalSectionTitle}>Current Faculty:</Text>
            <View style={styles.modalFacultyCard}>
              <View style={styles.modalFacultyAvatar}>
                <Text style={styles.modalFacultyAvatarText}>{currentFaculty.charAt(0)}</Text>
              </View>
              <View style={styles.modalFacultyInfo}>
                <Text style={styles.modalFacultyName}>{currentFaculty}</Text>
                <Text style={styles.modalFacultyStatus}>Currently Assigned</Text>
              </View>
            </View>
          </View>

          {/* Faculty Selection */}
          <View style={styles.modalFacultySelection}>
            <Text style={styles.modalSectionTitle}>Select New Faculty:</Text>
            <View style={styles.modalFacultyList}>
              {mockFaculty.map((faculty) => (
                <TouchableOpacity
                  key={faculty.id}
                  style={[
                    styles.modalFacultyOption,
                    selectedFaculty === faculty.name && styles.modalFacultyOptionSelected
                  ]}
                  onPress={() => setFacultyAssignments((prev) => ({ ...prev, [cls.id]: faculty.name }))}
                >
                  <View style={styles.modalFacultyOptionHeader}>
                    <View style={styles.modalFacultyOptionAvatar}>
                      <Text style={styles.modalFacultyOptionAvatarText}>{faculty.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.modalFacultyOptionInfo}>
                      <Text style={styles.modalFacultyOptionName}>{faculty.name}</Text>
                      <Text style={styles.modalFacultyOptionPosition}>{faculty.position}</Text>
                    </View>
                    {selectedFaculty === faculty.name && (
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    )}
                  </View>
                  <View style={styles.modalFacultyOptionDetails}>
                    <Text style={styles.modalFacultyOptionDetail}>Department: {faculty.department}</Text>
                    <Text style={styles.modalFacultyOptionDetail}>Load: {faculty.currentLoad}/{faculty.maxLoad}</Text>
                    <Text style={styles.modalFacultyOptionDetail}>Experience: {faculty.yearsOfExperience} years</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ModalContainer>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StaffAssignFacultyHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />
      
      <View style={styles.content}>
        {isTableView ? (
          <View style={styles.tableViewContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Subject</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Section</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Faculty</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Action</Text>
            </View>
            {filteredClasses.map((cls) => (
              <View key={cls.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{cls.subject} <Text style={{ color: '#6B7280' }}>({cls.code})</Text></Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{cls.section}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{cls.currentFaculty}</Text>
                <TouchableOpacity 
                  style={[styles.tableCell, { flex: 1 }]}
                  onPress={() => handleCardPress(cls, cls.currentFaculty)}
                >
                  <View style={styles.assignButtonSmall}>
                    <Text style={styles.assignButtonSmallText}>Assign</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              currentFaculty={facultyAssignments[cls.id]}
              onCardPress={handleCardPress}
            />
          ))
        )}
      </View>
      {renderAssignmentModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 100, // Add space at bottom for navigation bar
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tableViewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 15,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 15,
    color: '#353A40',
    paddingHorizontal: 6,
  },
  assignButtonSmall: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonSmallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  classContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: 17,
    fontWeight: '600',
    color: '#353A40',
  },
  classCode: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },
  classSection: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  classSectionValue: {
    fontWeight: '600',
    color: '#DC2626',
  },
  classDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 100,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '600',
    flex: 1,
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
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalClassInfo: {
    flex: 1,
  },
  modalClassCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  modalClassTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 4,
  },
  modalClassSection: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalClassDetails: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#353A40',
    marginBottom: 12,
  },
  modalDetailGrid: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#353A40',
    width: 80,
    marginLeft: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  modalCurrentFaculty: {
    marginBottom: 20,
  },
  modalFacultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  modalFacultyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalFacultyAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalFacultyInfo: {
    flex: 1,
  },
  modalFacultyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  modalFacultyStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalFacultySelection: {
    marginBottom: 20,
  },
  modalFacultyList: {
    gap: 8,
  },
  modalFacultyOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalFacultyOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  modalFacultyOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalFacultyOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalFacultyOptionAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  modalFacultyOptionInfo: {
    flex: 1,
  },
  modalFacultyOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#353A40',
  },
  modalFacultyOptionPosition: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalFacultyOptionDetails: {
    marginLeft: 48,
  },
  modalFacultyOptionDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
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
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  modalAssignButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalAssignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 