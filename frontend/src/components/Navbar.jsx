import React, { useState } from 'react';
import { Bell, Database, Cloud, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const Navbar = ({ title, subtitle }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-20 bg-slate-900/60 border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 backdrop-blur-md z-30">
      <div>
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1.5 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>FastAPI :8000</span>
          <span className="text-slate-600">|</span>
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Spring Boot :8080</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-700 transition-all relative"
            title="Status Sistem & Integrasi"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 ring-2 ring-slate-900"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card bg-slate-900 border border-slate-700/80 shadow-2xl p-4 rounded-2xl z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Status Ekosistem Cloud</span>
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Student API (FastAPI)</p>
                    <p className="text-[11px] text-slate-400">PostgreSQL aktif pada container Docker port 8000.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-200">Attendance API (Spring Boot)</p>
                    <p className="text-[11px] text-slate-400">MySQL aktif pada container Docker port 8080.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300">
                  <p className="font-semibold text-[11px]">Integrasi Multi-Service Berjalan</p>
                  <p className="text-[10px] text-indigo-400/80 mt-0.5">Semua data disinkronkan otomatis antar-service.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
