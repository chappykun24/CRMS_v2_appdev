import { UserRole } from './userRoles';

// Default permissions for each role
export const DEFAULT_PERMISSIONS = {
  [UserRole.ADMIN]: {
    // User Management - Full access
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewAllUsers: true,
    
    // Student Management - Full access
    canCreateStudents: true,
    canEditStudents: true,
    canDeleteStudents: true,
    canViewAllStudents: true,
    canViewStudentGrades: true,
    canEditStudentGrades: true,
    
    // Course Management - Full access
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: true,
    canViewAllCourses: true,
    canAssignFaculty: true,
    
    // Grade Management - Full access
    canSubmitGrades: true,
    canEditGrades: true,
    canViewAllGrades: true,
    canGenerateReports: true,
    
    // Attendance Management - Full access
    canTakeAttendance: true,
    canEditAttendance: true,
    canViewAllAttendance: true,
    
    // System Administration - Full access
    canAccessSystemSettings: true,
    canManageRoles: true,
    canViewAuditLogs: true,
    canBackupData: true,
    
    // Department Management - Full access
    canManageDepartments: true,
    canViewDepartmentReports: true,
    
    // Program Management - Full access
    canManagePrograms: true,
    canViewProgramReports: true,
  },

  [UserRole.STAFF]: {
    // User Management - Limited access
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: true,
    
    // Student Management - Full access
    canCreateStudents: true,
    canEditStudents: true,
    canDeleteStudents: false,
    canViewAllStudents: true,
    canViewStudentGrades: true,
    canEditStudentGrades: false,
    
    // Course Management - Limited access
    canCreateCourses: false,
    canEditCourses: false,
    canDeleteCourses: false,
    canViewAllCourses: true,
    canAssignFaculty: false,
    
    // Grade Management - Limited access
    canSubmitGrades: false,
    canEditGrades: false,
    canViewAllGrades: true,
    canGenerateReports: true,
    
    // Attendance Management - Limited access
    canTakeAttendance: false,
    canEditAttendance: true,
    canViewAllAttendance: true,
    
    // System Administration - No access
    canAccessSystemSettings: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canBackupData: false,
    
    // Department Management - Limited access
    canManageDepartments: false,
    canViewDepartmentReports: true,
    
    // Program Management - Limited access
    canManagePrograms: false,
    canViewProgramReports: true,
  },

  [UserRole.FACULTY]: {
    // User Management - No access
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    
    // Student Management - Limited access
    canCreateStudents: false,
    canEditStudents: false,
    canDeleteStudents: false,
    canViewAllStudents: false,
    canViewStudentGrades: true,
    canEditStudentGrades: true,
    
    // Course Management - Limited access
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: false,
    canViewAllCourses: true,
    canAssignFaculty: false,
    
    // Grade Management - Own courses only
    canSubmitGrades: true,
    canEditGrades: true,
    canViewAllGrades: false,
    canGenerateReports: true,
    
    // Attendance Management - Own courses only
    canTakeAttendance: true,
    canEditAttendance: true,
    canViewAllAttendance: false,
    
    // System Administration - No access
    canAccessSystemSettings: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canBackupData: false,
    
    // Department Management - Limited access
    canManageDepartments: true,
    canViewDepartmentReports: true,
    
    // Program Management - Limited access
    canManagePrograms: true,
    canViewProgramReports: true,
    
    // Additional permissions for dashboard features
    canViewReports: true,
    canApproveSyllabi: false,
    canCreateSyllabi: true,
    canEditSyllabi: true,
    canViewOwnSyllabi: true,
    canManageFaculty: false,
    canViewStudentStats: false,
    canViewCourseStats: false,
    canViewFacultyStats: false,
    canViewGradeStats: true,
  },

  [UserRole.DEAN]: {
    // User Management - Limited access
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewAllUsers: true,
    
    // Student Management - Full access within college
    canCreateStudents: true,
    canEditStudents: true,
    canDeleteStudents: false,
    canViewAllStudents: true,
    canViewStudentGrades: true,
    canEditStudentGrades: false,
    
    // Course Management - Limited access
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: false,
    canViewAllCourses: true,
    canAssignFaculty: true,
    
    // Grade Management - View only
    canSubmitGrades: false,
    canEditGrades: false,
    canViewAllGrades: true,
    canGenerateReports: true,
    
    // Attendance Management - View only
    canTakeAttendance: false,
    canEditAttendance: false,
    canViewAllAttendance: true,
    
    // System Administration - Limited access
    canAccessSystemSettings: false,
    canManageRoles: false,
    canViewAuditLogs: true,
    canBackupData: false,
    
    // Department Management - Full access within college
    canManageDepartments: true,
    canViewDepartmentReports: true,
    
    // Program Management - Limited access
    canManagePrograms: true,
    canViewProgramReports: true,
    
    // Additional permissions for dashboard features
    canViewReports: true,
    canApproveSyllabi: true,
    canCreateSyllabi: false,
    canEditSyllabi: false,
    canViewOwnSyllabi: false,
    canManageFaculty: true,
    canViewStudentStats: true,
    canViewCourseStats: true,
    canViewFacultyStats: true,
    canViewGradeStats: true,
  },

  [UserRole.PROGRAM_CHAIR]: {
    // User Management - No access
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewAllUsers: false,
    
    // Student Management - Limited access within program
    canCreateStudents: false,
    canEditStudents: false,
    canDeleteStudents: false,
    canViewAllStudents: false,
    canViewStudentGrades: true,
    canEditStudentGrades: false,
    
    // Course Management - Limited access within program
    canCreateCourses: true,
    canEditCourses: true,
    canDeleteCourses: false,
    canViewAllCourses: false,
    canAssignFaculty: true,
    
    // Grade Management - View only
    canSubmitGrades: false,
    canEditGrades: false,
    canViewAllGrades: true,
    canGenerateReports: true,
    
    // Attendance Management - View only
    canTakeAttendance: false,
    canEditAttendance: false,
    canViewAllAttendance: true,
    
    // System Administration - No access
    canAccessSystemSettings: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canBackupData: false,
    
    // Department Management - No access
    canManageDepartments: false,
    canViewDepartmentReports: false,
    
    // Program Management - Full access within own program
    canManagePrograms: true,
    canViewProgramReports: true,
    
    // Additional permissions for dashboard features
    canViewReports: true,
    canApproveSyllabi: true,
    canCreateSyllabi: false,
    canEditSyllabi: false,
    canViewOwnSyllabi: false,
    canManageFaculty: false,
    canViewStudentStats: false,
    canViewCourseStats: true,
    canViewFacultyStats: false,
    canViewGradeStats: true,
  },
};

// Helper function to get permissions for a specific role
export function getPermissionsForRole(role) {
  return DEFAULT_PERMISSIONS[role];
}

// Helper function to check if a role has a specific permission
export function roleHasPermission(role, permission) {
  return DEFAULT_PERMISSIONS[role][permission];
}

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    'canCreateUsers',
    'canEditUsers',
    'canDeleteUsers',
    'canViewAllUsers',
  ],
  
  STUDENT_MANAGEMENT: [
    'canCreateStudents',
    'canEditStudents',
    'canDeleteStudents',
    'canViewAllStudents',
    'canViewStudentGrades',
    'canEditStudentGrades',
  ],
  
  COURSE_MANAGEMENT: [
    'canCreateCourses',
    'canEditCourses',
    'canDeleteCourses',
    'canViewAllCourses',
    'canAssignFaculty',
  ],
  
  GRADE_MANAGEMENT: [
    'canSubmitGrades',
    'canEditGrades',
    'canViewAllGrades',
    'canGenerateReports',
  ],
  
  ATTENDANCE_MANAGEMENT: [
    'canTakeAttendance',
    'canEditAttendance',
    'canViewAllAttendance',
  ],
  
  SYSTEM_ADMINISTRATION: [
    'canAccessSystemSettings',
    'canManageRoles',
    'canViewAuditLogs',
    'canBackupData',
  ],
  
  DEPARTMENT_MANAGEMENT: [
    'canManageDepartments',
    'canViewDepartmentReports',
  ],
  
  PROGRAM_MANAGEMENT: [
    'canManagePrograms',
    'canViewProgramReports',
  ],
  
  SYLLABI_MANAGEMENT: [
    'canCreateSyllabi',
    'canEditSyllabi',
    'canViewOwnSyllabi',
    'canApproveSyllabi',
  ],
}; 