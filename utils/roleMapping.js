/**
 * Role mapping utilities for converting between backend and frontend role representations
 */

// Backend to Frontend role mapping
const BACKEND_TO_FRONTEND_ROLES = {
  'administrator': 'admin',
  'admin': 'admin', // Add direct mapping for 'admin'
  'dean': 'dean',
  'program chair': 'program_chair', 
  'program_chair': 'program_chair', // Accept both variants
  'faculty': 'faculty',
  'staff': 'staff'
};

// Frontend to Backend role mapping (reverse mapping)
const FRONTEND_TO_BACKEND_ROLES = {
  admin: 'Administrator',
  dean: 'Dean',
  program_chair: 'Program Chair',
  faculty: 'Faculty',
  staff: 'Staff'
};

/**
 * Maps backend role name to frontend role value
 * @param {string} backendRole - Role name from database
 * @returns {string} Frontend role value
 */
const mapBackendRoleToFrontend = (backendRole) => {
  if (!backendRole) {
    return null;
  }
  
  const lowerCaseRole = backendRole.toLowerCase();
  const mappedRole = BACKEND_TO_FRONTEND_ROLES[lowerCaseRole];
  
  if (!mappedRole) {
    console.warn(`[RoleMapping] Unknown backend role: ${backendRole}`);
    return backendRole; // Return original if no mapping found
  }
  
  return mappedRole;
};

/**
 * Maps frontend role value to backend role name
 * @param {string} frontendRole - Frontend role value
 * @returns {string} Backend role name
 */
const mapFrontendRoleToBackend = (frontendRole) => {
  if (!frontendRole) return null;
  
  const mappedRole = FRONTEND_TO_BACKEND_ROLES[frontendRole.toLowerCase()];
  if (!mappedRole) {
    console.warn(`[RoleMapping] Unknown frontend role: ${frontendRole}`);
    return frontendRole; // Return original if no mapping found
  }
  
  return mappedRole;
};

/**
 * Validates if a role is valid for the frontend
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid frontend role
 */
const isValidFrontendRole = (role) => {
  return Object.values(BACKEND_TO_FRONTEND_ROLES).includes(role);
};

/**
 * Validates if a role is valid for the backend
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid backend role
 */
const isValidBackendRole = (role) => {
  return Object.keys(BACKEND_TO_FRONTEND_ROLES).includes(role);
};

/**
 * Gets all available frontend roles
 * @returns {string[]} Array of frontend role values
 */
const getFrontendRoles = () => {
  return Object.values(BACKEND_TO_FRONTEND_ROLES);
};

/**
 * Gets all available backend roles
 * @returns {string[]} Array of backend role names
 */
const getBackendRoles = () => {
  return Object.keys(BACKEND_TO_FRONTEND_ROLES);
};

module.exports = {
  BACKEND_TO_FRONTEND_ROLES,
  FRONTEND_TO_BACKEND_ROLES,
  mapBackendRoleToFrontend,
  mapFrontendRoleToBackend,
  isValidFrontendRole,
  isValidBackendRole,
  getFrontendRoles,
  getBackendRoles
}; 