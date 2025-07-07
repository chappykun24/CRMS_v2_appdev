// Export all user role interfaces and types
export * from './permissions';
export * from './sampleData';
export * from './userRoles';

// Re-export commonly used functions for convenience
export { DEFAULT_PERMISSIONS, getPermissionsForRole, roleHasPermission } from './permissions';
export { UserRole } from './userRoles';
