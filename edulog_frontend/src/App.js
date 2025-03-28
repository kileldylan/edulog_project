import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/login';
import Register from './components/register';
import AdminHome from './components/adminHome';
import AttendanceRecords from './components/attendanceManagement';
import StudentHome from './components/studentHome';
import CalendarPage from './components/calendarPage';
import ProfilePage from './components/profilePage';
import StudentProfile from './components/studentProfile';
import ReportsPage from './components/reports';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Handle cross-tab logout
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'logout_event') {
        sessionStorage.clear();
        window.location.href = '/login?reason=logged_out';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin routes */}
        <Route path="/adminHome" element={
          <ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute allowedRoles={['admin']}><AttendanceRecords /></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>
        } />
        
        {/* Student routes */}
        <Route path="/studentHome" element={
          <ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>
        } />
        <Route path="/calendarPage" element={
          <ProtectedRoute allowedRoles={['admin', 'student']}><CalendarPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['student']}><ProfilePage /></ProtectedRoute>
        } />
        
        {/* Shared routes */}
        <Route path="/studentProfile" element={
          <ProtectedRoute allowedRoles={['admin', 'student']}><StudentProfile /></ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;