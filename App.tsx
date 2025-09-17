
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from './types';

import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AttendanceHistoryPage from './pages/employee/AttendanceHistoryPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import AttendanceLogsPage from './pages/shared/AttendanceLogsPage';
import ReportsPage from './pages/shared/ReportsPage';
import ProfilePage from './pages/shared/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import AuthPopupPage from './pages/AuthPopupPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div>Loading...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth-popup" element={<AuthPopupPage />} />
            
            <Route path="/" element={
                <ProtectedRoute roles={[Role.ADMIN, Role.EMPLOYEE, Role.HR]}>
                    <DashboardLayout />
                </ProtectedRoute>
            }>
                <Route index element={
                  !user ? <Navigate to="/login" /> :
                  user.role === Role.ADMIN ? <Navigate to="/admin/dashboard" replace /> :
                  user.role === Role.EMPLOYEE ? <Navigate to="/employee/dashboard" replace /> :
                  <Navigate to="/attendance-logs" replace /> // HR default
                } />

                {/* Employee Routes */}
                <Route path="employee/dashboard" element={<ProtectedRoute roles={[Role.EMPLOYEE]}><EmployeeDashboard /></ProtectedRoute>} />
                <Route path="employee/history" element={<ProtectedRoute roles={[Role.EMPLOYEE]}><AttendanceHistoryPage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="admin/dashboard" element={<ProtectedRoute roles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="admin/employees" element={<ProtectedRoute roles={[Role.ADMIN]}><EmployeeManagementPage /></ProtectedRoute>} />

                {/* Shared Routes */}
                <Route path="attendance-logs" element={<ProtectedRoute roles={[Role.ADMIN, Role.HR]}><AttendanceLogsPage /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute roles={[Role.ADMIN, Role.HR]}><ReportsPage /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute roles={[Role.ADMIN, Role.EMPLOYEE, Role.HR]}><ProfilePage /></ProtectedRoute>} />
            </Route>

            <Route path="/unauthorized" element={<div className="flex items-center justify-center h-screen text-red-500 text-2xl">401: Unauthorized Access</div>} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
