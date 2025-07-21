// User Roles Enum
export const UserRole = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FACULTY: 'faculty',
  DEAN: 'dean',
  PROGRAM_CHAIR: 'program_chair'
};

// Helper function to check if user has specific permission
export function hasPermission(user, permission) {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions[permission] || false;
}

// Helper function to get user's display name
export function getUserDisplayName(user) {
  return `${user.firstName} ${user.lastName}`;
}

// Helper function to get user's role display name
export function getRoleDisplayName(role) {
  const roleNames = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.STAFF]: 'Staff Member',
    [UserRole.FACULTY]: 'Faculty Member',
    [UserRole.DEAN]: 'Dean',
    [UserRole.PROGRAM_CHAIR]: 'Program Chair'
  };
  return roleNames[role];
} 