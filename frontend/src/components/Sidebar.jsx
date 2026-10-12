import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, BarChart3, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mahasiswa (Students)', path: '/students', icon: Users },
    { label: 'Presensi (Attendance)', path: '/attendance', icon: CalendarCheck },
    { label: 'Laporan (Reports)', path: '/reports', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md z-20">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            SIM
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100 leading-tight">Student & Attendance</h1>
            <p className="text-xs text-indigo-400 font-medium">Cloud Integrated App</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="glass-card p-3 mb-3 flex items-center gap-3 bg-slate-800/40">
          <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-semibold text-sm border border-indigo-500/30">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.username || 'User'}</p>
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Role: {user?.role || 'Admin'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
