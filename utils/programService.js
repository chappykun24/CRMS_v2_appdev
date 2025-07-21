import { apiClient } from './api';

// Program Management Service
export const programService = {
  // Get all programs
  async getPrograms() {
    try {
      const response = await apiClient.get('/programs');
      return response.programs || [];
    } catch (error) {
      console.error('Error fetching programs:', error);
      throw error;
    }
  },

  // Get single program by ID
  async getProgram(programId) {
    try {
      const response = await apiClient.get(`/programs/${programId}`);
      return response;
    } catch (error) {
      console.error('Error fetching program:', error);
      throw error;
    }
  },

  // Create new program
  async createProgram(programData) {
    try {
      const response = await apiClient.post('/programs', programData);
      return response;
    } catch (error) {
      console.error('Error creating program:', error);
      throw error;
    }
  },

  // Update program
  async updateProgram(programId, programData) {
    try {
      const response = await apiClient.put(`/programs/${programId}`, programData);
      return response;
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  },

  // Delete program
  async deleteProgram(programId) {
    try {
      const response = await apiClient.delete(`/programs/${programId}`);
      return response;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  },

  // Get all departments
  async getDepartments() {
    try {
      const response = await apiClient.get('/departments');
      return response.departments || [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get all specializations
  async getSpecializations() {
    try {
      const response = await apiClient.get('/specializations');
      return response.specializations || [];
    } catch (error) {
      console.error('Error fetching specializations:', error);
      throw error;
    }
  },

  // Get single specialization by ID
  async getSpecialization(specializationId) {
    try {
      const response = await apiClient.get(`/specializations/${specializationId}`);
      return response;
    } catch (error) {
      console.error('Error fetching specialization:', error);
      throw error;
    }
  },

  // Create new specialization
  async createSpecialization(specializationData) {
    try {
      const response = await apiClient.post('/specializations', specializationData);
      return response;
    } catch (error) {
      console.error('Error creating specialization:', error);
      throw error;
    }
  },

  // Update specialization
  async updateSpecialization(specializationId, specializationData) {
    try {
      const response = await apiClient.put(`/specializations/${specializationId}`, specializationData);
      return response;
    } catch (error) {
      console.error('Error updating specialization:', error);
      throw error;
    }
  },

  // Delete specialization
  async deleteSpecialization(specializationId) {
    try {
      const response = await apiClient.delete(`/specializations/${specializationId}`);
      return response;
    } catch (error) {
      console.error('Error deleting specialization:', error);
      throw error;
    }
  },

  // Course Management Methods
  
  // Get all courses
  async getCourses() {
    try {
      const response = await apiClient.get('/courses');
      return response.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get single course by ID
  async getCourse(courseId) {
    try {
      const response = await apiClient.get(`/courses/${courseId}`);
      return response;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Create new course
  async createCourse(courseData) {
    try {
      const response = await apiClient.post('/courses', courseData);
      return response;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Update course
  async updateCourse(courseId, courseData) {
    try {
      const response = await apiClient.put(`/courses/${courseId}`, courseData);
      return response;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Delete course
  async deleteCourse(courseId) {
    try {
      const response = await apiClient.delete(`/courses/${courseId}`);
      return response;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // Get all school terms
  async getTerms() {
    try {
      const response = await apiClient.get('/terms');
      return response.terms || [];
    } catch (error) {
      console.error('Error fetching terms:', error);
      throw error;
    }
  }
};

export default programService; 