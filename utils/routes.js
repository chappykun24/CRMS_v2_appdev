// Centralized route configuration
export const ROUTES = {
  // Public routes (accessible to everyone)
  PUBLIC: '/public',
  LOGIN: '/public/login',
  FACULTY_SIGNUP: '/public/faculty-signup',
  HELP: '/public/help',
  
  // Welcome page
  WELCOME: '/welcome',
  
  // Role-based dashboards
  ADMIN_DASHBOARD: '/users/admin/dashboard',
  FACULTY_DASHBOARD: '/users/faculty/dashboard',
  STAFF_DASHBOARD: '/users/staff/dashboard',
  DEAN_DASHBOARD: '/users/dean/dashboard',
  PROGRAM_CHAIR_DASHBOARD: '/users/program-chair/dashboard',
  
  // Role-based pages
  ADMIN: {
    DASHBOARD: '/users/admin/dashboard',
    USER_MANAGEMENT: '/users/admin/user-management',
    COURSE_MANAGEMENT: '/pages/CourseManagement/CourseManagement',
    FACULTY_APPROVAL: '/users/admin/faculty-approval',
    SYLLABUS_APPROVAL: '/users/admin/syllabus-approval',
  },
  
  FACULTY: {
    DASHBOARD: '/users/faculty/dashboard',
    MY_CLASSES: '/users/faculty/MyClasses',
    MY_SYLLABI: '/users/faculty/MySyllabi',
    SYLLABI_CREATION: '/users/faculty/SyllabiCreation',
    PROFILE: '/users/faculty/Profile',
    COURSE_MANAGEMENT: '/pages/CourseManagement/CourseManagement',
    // Add missing faculty routes
    ASSESSMENT_MANAGEMENT: '/users/faculty/AssessmentManagement',
    ATTENDANCE_MANAGEMENT: '/users/faculty/AttendanceManagement',
    GRADE_MANAGEMENT: '/users/faculty/GradeManagement',
    ANALYTICS_DASHBOARD: '/users/faculty/AnalyticsDashboard',
    ASSESSMENT_TEMPLATES: '/users/faculty/AssessmentTemplates',
    CLASS_STUDENTS: '/users/faculty/ClassStudents',
    CREATE_SESSION: '/users/faculty/CreateSession',
    SUB_ASSESSMENT_GRADE_MANAGEMENT: '/users/faculty/SubAssessmentGradeManagement',
    SLIDESHOW_PAGE: '/users/faculty/SlideshowPage',
  },
  
  STAFF: {
    DASHBOARD: '/users/staff/dashboard',
    STUDENT_MANAGEMENT: '/users/staff/student-management',
    COURSE_MANAGEMENT: '/pages/CourseManagement/CourseManagement',
  },
  
  DEAN: {
    DASHBOARD: '/users/dean/dashboard',
  },
  
  PROGRAM_CHAIR: {
    DASHBOARD: '/users/program-chair/dashboard',
    COURSE_MANAGEMENT: '/users/program-chair/CourseManagement',
    REVIEW_SUBMISSIONS: '/users/program-chair/ReviewSubmissions',
    DEPARTMENT_ANALYTICS: '/users/program-chair/DepartmentAnalytics',
    MY_PROFILE: '/users/program-chair/MyProfile',
    GENERATE_REPORT: '/users/program-chair/GenerateReport',
  },
};

// Helper function to get role-specific routes
export const getRoleRoutes = (role) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN;
    case 'faculty':
      return ROUTES.FACULTY;
    case 'staff':
      return ROUTES.STAFF;
    case 'dean':
      return ROUTES.DEAN;
    case 'program_chair':
      return ROUTES.PROGRAM_CHAIR;
    default:
      return ROUTES.PUBLIC;
  }
}; 