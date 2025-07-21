/**
 * Test script for role mapping functionality
 * Run with: node utils/testRoleMapping.js
 */

const { 
  mapBackendRoleToFrontend, 
  mapFrontendRoleToBackend,
  isValidFrontendRole,
  isValidBackendRole,
  getFrontendRoles,
  getBackendRoles,
  BACKEND_TO_FRONTEND_ROLES,
  FRONTEND_TO_BACKEND_ROLES
} = require('./roleMapping');

console.log('🧪 Testing Role Mapping Functionality\n');

// Test 1: Backend to Frontend mapping
console.log('1. Testing Backend to Frontend Role Mapping:');
const backendRoles = ['admin', 'dean', 'program_chair', 'faculty', 'staff'];
backendRoles.forEach(role => {
  const mapped = mapBackendRoleToFrontend(role);
  console.log(`   ${role} -> ${mapped}`);
});
console.log();

// Test 2: Frontend to Backend mapping
console.log('2. Testing Frontend to Backend Role Mapping:');
const frontendRoles = ['admin', 'dean', 'program_chair', 'faculty', 'staff'];
frontendRoles.forEach(role => {
  const mapped = mapFrontendRoleToBackend(role);
  console.log(`   ${role} -> ${mapped}`);
});
console.log();

// Test 3: Case sensitivity
console.log('3. Testing Case Sensitivity:');
const testCases = ['ADMIN', 'Admin', 'admin', 'DEAN', 'Dean', 'dean'];
testCases.forEach(role => {
  const mapped = mapBackendRoleToFrontend(role);
  console.log(`   "${role}" -> "${mapped}"`);
});
console.log();

// Test 4: Invalid roles
console.log('4. Testing Invalid Roles:');
const invalidRoles = ['invalid', 'unknown', 'guest', ''];
invalidRoles.forEach(role => {
  const mapped = mapBackendRoleToFrontend(role);
  console.log(`   "${role}" -> "${mapped}"`);
});
console.log();

// Test 5: Validation functions
console.log('5. Testing Validation Functions:');
const testRoles = ['admin', 'invalid', 'faculty', 'unknown'];
testRoles.forEach(role => {
  const isValidFrontend = isValidFrontendRole(role);
  const isValidBackend = isValidBackendRole(role);
  console.log(`   "${role}": Frontend valid: ${isValidFrontend}, Backend valid: ${isValidBackend}`);
});
console.log();

// Test 6: Available roles
console.log('6. Available Roles:');
console.log(`   Frontend roles: [${getFrontendRoles().join(', ')}]`);
console.log(`   Backend roles: [${getBackendRoles().join(', ')}]`);
console.log();

// Test 7: Mapping objects
console.log('7. Mapping Objects:');
console.log('   Backend to Frontend mapping:', BACKEND_TO_FRONTEND_ROLES);
console.log('   Frontend to Backend mapping:', FRONTEND_TO_BACKEND_ROLES);
console.log();

console.log('✅ Role mapping tests completed!'); 