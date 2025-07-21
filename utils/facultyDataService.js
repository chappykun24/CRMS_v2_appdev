// Faculty Data Service - Manages faculty applications and approvals
import AsyncStorage from '@react-native-async-storage/async-storage';

const FACULTY_APPLICATIONS_KEY = 'faculty_applications';
const FACULTY_APPROVALS_KEY = 'faculty_approvals';

// Faculty application data structure based on the registration form
export const createFacultyApplication = (formData) => {
  return {
    id: Date.now().toString(), // Simple ID generation
    ...formData,
    status: 'pending',
    submissionDate: new Date().toISOString().split('T')[0],
    lastModified: new Date().toISOString().split('T')[0],
    documents: [], // Placeholder for document uploads
    adminNotes: '',
    approvalDate: null,
    approvedBy: null,
    rejectionReason: null
  };
};

// Save faculty application
export const saveFacultyApplication = async (application) => {
  try {
    const existingApplications = await getFacultyApplications();
    const updatedApplications = [...existingApplications, application];
    await AsyncStorage.setItem(FACULTY_APPLICATIONS_KEY, JSON.stringify(updatedApplications));
    return true;
  } catch (error) {
    console.error('Error saving faculty application:', error);
    return false;
  }
};

// Get all faculty applications
export const getFacultyApplications = async () => {
  try {
    const applications = await AsyncStorage.getItem(FACULTY_APPLICATIONS_KEY);
    return applications ? JSON.parse(applications) : [];
  } catch (error) {
    console.error('Error getting faculty applications:', error);
    return [];
  }
};

// Update faculty application status
export const updateFacultyApplicationStatus = async (applicationId, status, adminNotes = '', approvedBy = null) => {
  try {
    const applications = await getFacultyApplications();
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        return {
          ...app,
          status,
          adminNotes,
          lastModified: new Date().toISOString().split('T')[0],
          approvalDate: status === 'approved' ? new Date().toISOString().split('T')[0] : null,
          approvedBy: status === 'approved' ? approvedBy : null,
          rejectionReason: status === 'rejected' ? adminNotes : null
        };
      }
      return app;
    });
    
    await AsyncStorage.setItem(FACULTY_APPLICATIONS_KEY, JSON.stringify(updatedApplications));
    return true;
  } catch (error) {
    console.error('Error updating faculty application status:', error);
    return false;
  }
};

// Get faculty applications by status
export const getFacultyApplicationsByStatus = async (status) => {
  try {
    const applications = await getFacultyApplications();
    if (status === 'all') {
      return applications;
    }
    return applications.filter(app => app.status === status);
  } catch (error) {
    console.error('Error getting faculty applications by status:', error);
    return [];
  }
};

// Delete faculty application
export const deleteFacultyApplication = async (applicationId) => {
  try {
    const applications = await getFacultyApplications();
    const updatedApplications = applications.filter(app => app.id !== applicationId);
    await AsyncStorage.setItem(FACULTY_APPLICATIONS_KEY, JSON.stringify(updatedApplications));
    return true;
  } catch (error) {
    console.error('Error deleting faculty application:', error);
    return false;
  }
};

// Get application statistics
export const getFacultyApplicationStats = async () => {
  try {
    const applications = await getFacultyApplications();
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
    return stats;
  } catch (error) {
    console.error('Error getting faculty application stats:', error);
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
};

// Mock data for initial setup (if no data exists)
export const initializeMockData = async () => {
  try {
    const existingApplications = await getFacultyApplications();
    if (existingApplications.length === 0) {
      const mockApplications = [
        {
          id: '1',
          lastName: 'Doe',
          firstName: 'John',
          middleInitial: 'A',
          suffix: '',
          email: 'john.doe@university.edu',
          department: 'Computer Science',
          specialization: 'Software Engineering',
          termStart: '2024-01-15',
          termEnd: '2024-05-15',
          profileType: 'faculty',
          status: 'pending',
          submissionDate: '2024-01-15',
          lastModified: '2024-01-15',
          documents: ['CV.pdf', 'Transcript.pdf', 'Recommendation Letter.pdf'],
          adminNotes: '',
          approvalDate: null,
          approvedBy: null,
          rejectionReason: null
        },
        {
          id: '2',
          lastName: 'Smith',
          firstName: 'Jane',
          middleInitial: 'B',
          suffix: '',
          email: 'jane.smith@university.edu',
          department: 'Mathematics',
          specialization: 'Applied Mathematics',
          termStart: '2024-01-14',
          termEnd: '2024-05-14',
          profileType: 'faculty',
          status: 'pending',
          submissionDate: '2024-01-14',
          lastModified: '2024-01-14',
          documents: ['CV.pdf', 'Transcript.pdf', 'Research Papers.pdf'],
          adminNotes: '',
          approvalDate: null,
          approvedBy: null,
          rejectionReason: null
        },
        {
          id: '3',
          lastName: 'Johnson',
          firstName: 'Michael',
          middleInitial: 'C',
          suffix: 'PhD',
          email: 'michael.johnson@university.edu',
          department: 'Physics',
          specialization: 'Quantum Physics',
          termStart: '2024-01-10',
          termEnd: '2024-05-10',
          profileType: 'faculty',
          status: 'approved',
          submissionDate: '2024-01-10',
          lastModified: '2024-01-12',
          documents: ['CV.pdf', 'Transcript.pdf', 'Publications.pdf'],
          adminNotes: 'Excellent qualifications and experience',
          approvalDate: '2024-01-12',
          approvedBy: 'admin@university.edu',
          rejectionReason: null
        }
      ];
      
      await AsyncStorage.setItem(FACULTY_APPLICATIONS_KEY, JSON.stringify(mockApplications));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing mock data:', error);
    return false;
  }
}; 