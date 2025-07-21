import { apiClient } from './api';
import { FRONTEND_TO_BACKEND_ROLES } from './roleMapping';

class UserService {
  // Fetch all users with optional filtering
  async getUsers(options = {}) {
    try {
      const { limit = 100, offset = 0, role, is_approved } = options;
      
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      if (role) {
        // Map frontend role to backend role name
        const backendRole = FRONTEND_TO_BACKEND_ROLES[role] || role;
        queryParams.append('role', backendRole);
      }
      if (is_approved !== undefined) queryParams.append('is_approved', is_approved.toString());
      
      const response = await apiClient.get(`/users?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Fetch a single user by ID
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Update user approval status
  async updateUserApproval(userId, isApproved, approvedBy) {
    try {
      const response = await apiClient.put(`/users/${userId}/approval`, {
        is_approved: isApproved,
        approved_by: approvedBy
      });
      return response;
    } catch (error) {
      console.error('Error updating user approval:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    return this.getUsers({ role });
  }

  // Get pending approvals
  async getPendingApprovals() {
    return this.getUsers({ is_approved: false });
  }

  // Get approved users
  async getApprovedUsers() {
    return this.getUsers({ is_approved: true });
  }

  // Search users by name or email
  async searchUsers(searchTerm) {
    try {
      const allUsers = await this.getUsers({ limit: 1000 });
      const searchLower = searchTerm.toLowerCase();
      
      return {
        users: allUsers.users.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        ),
        total: allUsers.users.length
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const allUsers = await this.getUsers({ limit: 1000 });
      const users = allUsers.users;
      
      const stats = {
        total: users.length,
        approved: users.filter(u => u.is_approved).length,
        pending: users.filter(u => !u.is_approved).length,
        byRole: {}
      };
      
      // Count by role
      users.forEach(user => {
        const role = user.role_name || 'Unknown';
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Consistent interface for faculty approval data
  async getFacultyApprovalData({ status = 'all', searchQuery = '' } = {}) {
    try {
      // Determine is_approved filter
      let is_approved;
      if (status === 'pending') is_approved = false;
      else if (status === 'approved') is_approved = true;
      // If status is 'all' or unknown, do not filter by is_approved

      // Fetch all faculty users with optional approval filter
      const response = await this.getUsers({ role: 'faculty', ...(is_approved !== undefined ? { is_approved } : {}) });
      let faculty = response.users || [];

      // Apply search filter (name, email, designation, office_assigned, bio, position, contact_email, specialization)
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        faculty = faculty.filter(user =>
          (user.name && user.name.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.designation && user.designation.toLowerCase().includes(query)) ||
          (user.office_assigned && user.office_assigned.toLowerCase().includes(query)) ||
          (user.bio && user.bio.toLowerCase().includes(query)) ||
          (user.position && user.position.toLowerCase().includes(query)) ||
          (user.contact_email && user.contact_email.toLowerCase().includes(query)) ||
          (user.specialization && user.specialization.toLowerCase().includes(query))
        );
      }

      // Compute stats for all faculty (regardless of search)
      const allFaculty = (await this.getUsers({ role: 'faculty', limit: 1000 })).users || [];
      const stats = {
        total: allFaculty.length,
        pending: allFaculty.filter(u => !u.is_approved).length,
        approved: allFaculty.filter(u => u.is_approved).length,
        rejected: 0 // No explicit rejected state in schema; can be extended if needed
      };

      return { faculty, stats };
    } catch (error) {
      console.error('Error fetching faculty approval data:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService; 