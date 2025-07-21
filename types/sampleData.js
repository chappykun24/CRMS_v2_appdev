import { UserRole } from './userRoles';

// Sample College
export const sampleCollege = {
  id: 'college-001',
  name: 'College of Engineering and Technology',
  code: 'CET',
  deanId: 'dean-001',
  departments: ['dept-001', 'dept-002', 'dept-003'],
  totalStudents: 2500,
  totalFaculty: 150,
};

// Sample Departments
export const sampleDepartments = [
  {
    id: 'dept-001',
    name: 'Computer Science Department',
    code: 'CS',
    deanId: 'dean-001',
    facultyCount: 25,
    studentCount: 800,
    programs: ['prog-001', 'prog-002'],
  },
  {
    id: 'dept-002',
    name: 'Electrical Engineering Department',
    code: 'EE',
    deanId: 'dean-001',
    facultyCount: 30,
    studentCount: 900,
    programs: ['prog-003', 'prog-004'],
  },
  {
    id: 'dept-003',
    name: 'Mechanical Engineering Department',
    code: 'ME',
    deanId: 'dean-001',
    facultyCount: 28,
    studentCount: 800,
    programs: ['prog-005', 'prog-006'],
  },
];

// Sample Programs
export const samplePrograms = [
  {
    id: 'prog-001',
    name: 'Bachelor of Science in Computer Science',
    code: 'BSCS',
    departmentId: 'dept-001',
    chairId: 'chair-001',
    degreeType: 'bachelor',
    totalCredits: 120,
    duration: 4,
    isActive: true,
  },
  {
    id: 'prog-002',
    name: 'Master of Science in Computer Science',
    code: 'MSCS',
    departmentId: 'dept-001',
    chairId: 'chair-001',
    degreeType: 'master',
    totalCredits: 36,
    duration: 2,
    isActive: true,
  },
  {
    id: 'prog-003',
    name: 'Bachelor of Science in Electrical Engineering',
    code: 'BSEE',
    departmentId: 'dept-002',
    chairId: 'chair-002',
    degreeType: 'bachelor',
    totalCredits: 130,
    duration: 4,
    isActive: true,
  },
];

// Sample Office Hours
export const sampleOfficeHours = [
  {
    day: 'monday',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Room 301, CS Building',
  },
  {
    day: 'wednesday',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Room 301, CS Building',
  },
  {
    day: 'friday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Room 301, CS Building',
  },
];

// Sample Users for each role
export const sampleUsers = [
  // Demo users removed. This array is now empty for demo button UI only.
];

// Helper function to get user by ID
export function getUserById(id) {
  return sampleUsers.find(user => user.id === id);
}

// Helper function to get users by role
export function getUsersByRole(role) {
  return sampleUsers.filter(user => user.role === role);
}

// Helper function to get users by department
export function getUsersByDepartment(departmentId) {
  return sampleUsers.filter(user => {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.DEAN) return true;
    if (user.role === UserRole.STAFF && 'departmentId' in user) {
      return user.departmentId === departmentId;
    }
    if (user.role === UserRole.FACULTY && 'departmentId' in user) {
      return user.departmentId === departmentId;
    }
    if (user.role === UserRole.PROGRAM_CHAIR && 'departmentId' in user) {
      return user.departmentId === departmentId;
    }
    return false;
  });
}

// Helper function to get department by ID
export function getDepartmentById(id) {
  return sampleDepartments.find(dept => dept.id === id);
}

// Helper function to get program by ID
export function getProgramById(id) {
  return samplePrograms.find(prog => prog.id === id);
} 