import { router } from 'expo-router';
import { useEffect } from 'react';

export default function FacultyApproval() {
  useEffect(() => {
    // Redirect to user management with faculty filter
    router.replace({ pathname: '/users/admin/user-management', params: { role: 'faculty' } });
  }, []);
  return null;
} 