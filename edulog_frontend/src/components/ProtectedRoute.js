import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = sessionStorage.getItem('access_token');
  const role = sessionStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (role === 'student' && !sessionStorage.getItem('student_id')) {
    console.error('Student session incomplete');
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Add this line to make it a default export
export default ProtectedRoute;