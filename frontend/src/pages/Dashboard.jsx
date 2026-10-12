import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentService, AttendanceService } from '../services/api';
import { Users, CalendarCheck, Percent, AlertTriangle, ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAttendancePct: 0,
    monthlyRecords: 0,
    lowAttendanceCount: 0
  });
  const [lowStudents, setLowStudents] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [studentsRes, monthlyRes, lowRes, recordsRes] = await Promise.allSettled([
          StudentService.getStudents(),
          AttendanceService.getMonthlyReport(),
          AttendanceService.getLowAttendanceReport(75.0),
          AttendanceService.getAllRecords()
        ]);

        const students = studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value) ? studentsRes.value : [];
        const monthly = monthlyRes.status === 'fulfilled' && monthlyRes.value ? monthlyRes.value : {};
        const low = lowRes.status === 'fulfilled' && Array.isArray(lowRes.value) ? lowRes.value : [];
        const records = recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value) ? recordsRes.value : [];

        setStats({
          totalStudents: students.length,
          activeAttendancePct: monthly.overall_attendance_percentage !== undefined ? monthly.overall_attendance_percentage : 0,
          monthlyRecords: monthly.total_records || 0,
          lowAttendanceCount: low.length
        });
        setLowStudents(low);
        setRecentAttendance(records.slice(-5).reverse());
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="glass-card p-6 border-l-4 border-l-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Mahasiswa</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.totalStudents}</h3>
            <p className="text-xs text-indigo-400 mt-1 font-medium">Terdaftar di Student Service</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-6 border-l-4 border-l-cyan-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kehadiran Rata-rata</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.activeAttendancePct}%</h3>
            <p className="text-xs text-cyan-400 mt-1 font-medium">Data Agregat Periodik</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-6 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catatan Attendance</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.monthlyRecords}</h3>
            <p className="text-xs text-emerald-400 mt-1 font-medium">Total Sesi Presensi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-6 border-l-4 border-l-rose-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Attendance (&lt;75%)</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{stats.lowAttendanceCount}</h3>
            <p className="text-xs text-rose-400 mt-1 font-medium">Perlu Perhatian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Low Attendance Alert + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Low Attendance List (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Ringkasan Mahasiswa Attendance Rendah</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Persentase kehadiran di bawah ambang batas 75%</p>
            </div>
            <Link to="/reports" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <span>Lihat Laporan Detail</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {lowStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <span>Semua mahasiswa memiliki tingkat kehadiran yang baik (&gt;75%).</span>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStudents.map((st) => (
                <div key={st.student_id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{st.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">NIM: {st.roll_number} | {st.department}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {st.percentage}% Kehadiran
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{st.total_sessions} Sesi Pertemuan</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Shortcuts & Recent Attendance Logs */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-md font-bold text-slate-100 border-b border-slate-800 pb-3">Aksi Cepat (Shortcuts)</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/students" className="p-3.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-between text-sm font-medium transition-all">
                <span>Kelola Data Mahasiswa</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-400" />
              </Link>
              <Link to="/attendance" className="p-3.5 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-between text-sm font-medium transition-all">
                <span>Catat Presensi Baru</span>
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              </Link>
              <Link to="/reports" className="p-3.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-between text-sm font-medium transition-all">
                <span>Analisis Laporan Kehadiran</span>
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-md font-bold text-slate-100 border-b border-slate-800 pb-3">Aktivitas Presensi Terakhir</h3>
            <div className="space-y-3">
              {recentAttendance.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800/30">
                  <div>
                    <p className="font-semibold text-slate-300">{rec.student?.name || 'Mahasiswa'}</p>
                    <p className="text-[10px] text-slate-500">{rec.date} - {rec.courseName}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    rec.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' :
                    rec.status === 'LATE' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
