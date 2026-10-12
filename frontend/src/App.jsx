import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentDetail } from './pages/StudentDetail';
import { Attendance } from './pages/Attendance';
import { Reports } from './pages/Reports';

const ProtectedLayout = ({ children, title, subtitle }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm font-medium">
        Memuat aplikasi SIM...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title={title} subtitle={subtitle} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedLayout title="Dashboard Integration" subtitle="Ringkasan utama statistik mahasiswa dan data kehadiran terpadu">
                <Dashboard />
              </ProtectedLayout>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedLayout title="Kelola Mahasiswa" subtitle="Master data mahasiswa dari Student Management System API">
                <Students />
              </ProtectedLayout>
            }
          />

          <Route
            path="/students/:rollNumber"
            element={
              <ProtectedLayout title="Detail Mahasiswa Terintegrasi" subtitle="Profil & statistik kehadiran dari dua service terpisah">
                <StudentDetail />
              </ProtectedLayout>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedLayout title="Kelola Presensi (Attendance)" subtitle="Pencatatan dan riwayat presensi dari Attendance Management API">
                <Attendance />
              </ProtectedLayout>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedLayout title="Laporan & Analytics" subtitle="Laporan bulanan dan analisis presensi mahasiswa">
                <Reports />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
