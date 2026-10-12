import React, { useState, useEffect } from 'react';
import { AttendanceService, StudentService } from '../services/api';
import { BarChart3, AlertTriangle, Download, Sliders, CheckCircle2, TrendingUp } from 'lucide-react';

export const Reports = () => {
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [lowAttendanceList, setLowAttendanceList] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({});
  const [threshold, setThreshold] = useState(75.0);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [monthlyRes, lowRes, deptRes] = await Promise.allSettled([
        AttendanceService.getMonthlyReport(),
        AttendanceService.getLowAttendanceReport(threshold),
        StudentService.getPercentStudent()
      ]);

      setMonthlyReport(monthlyRes.status === 'fulfilled' && monthlyRes.value ? monthlyRes.value : null);
      setLowAttendanceList(lowRes.status === 'fulfilled' && Array.isArray(lowRes.value) ? lowRes.value : []);
      setDepartmentStats(deptRes.status === 'fulfilled' && deptRes.value?.department_distribution ? deptRes.value.department_distribution : {});
    } catch (e) {
      console.error("Error fetching reports:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [threshold]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <span>Laporan & Analisis Kehadiran Mahasiswa</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Laporan bulanan, persentase kehadiran, dan filter ambang batas low attendance</p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Cetak / Export Laporan</span>
        </button>
      </div>

      {/* Monthly Summary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Catatan Sesi</span>
          <span className="text-3xl font-extrabold text-slate-100 mt-2 block">{monthlyReport?.total_records || 0}</span>
          <span className="text-[10px] text-indigo-400 mt-1 block">Seluruh Sesi Pertemuan</span>
        </div>
        <div className="glass-card p-5 text-center border-b-4 border-b-emerald-500">
          <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Hadir (Present)</span>
          <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">{monthlyReport?.total_present || 0}</span>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Status PRESENT</span>
        </div>
        <div className="glass-card p-5 text-center border-b-4 border-b-amber-500">
          <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Terlambat (Late)</span>
          <span className="text-3xl font-extrabold text-amber-400 mt-2 block">{monthlyReport?.total_late || 0}</span>
          <span className="text-[10px] text-amber-400/80 mt-1 block">Status LATE</span>
        </div>
        <div className="glass-card p-5 text-center border-b-4 border-b-rose-500">
          <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Absen (Absent)</span>
          <span className="text-3xl font-extrabold text-rose-400 mt-2 block">{monthlyReport?.total_absent || 0}</span>
          <span className="text-[10px] text-rose-400/80 mt-1 block">Status ABSENT</span>
        </div>
      </div>

      {/* Low Attendance Filter & List */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Daftar Mahasiswa dengan Kehadiran Rendah</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Filter ambang batas persentase kehadiran (Low Attendance Report)</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-300 font-medium">Batas Minimum:</span>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="accent-purple-500 cursor-pointer"
            />
            <span className="font-bold font-mono text-purple-400 text-xs">{threshold}%</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Memuat laporan...</div>
        ) : lowAttendanceList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>Tidak ada mahasiswa dengan persentase kehadiran di bawah {threshold}%.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">NIM / Roll</th>
                  <th className="px-6 py-3.5">Nama Mahasiswa</th>
                  <th className="px-6 py-3.5">Jurusan / Departemen</th>
                  <th className="px-6 py-3.5">Total Pertemuan</th>
                  <th className="px-6 py-3.5">Persentase Kehadiran</th>
                  <th className="px-6 py-3.5">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {lowAttendanceList.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">{st.roll_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{st.name}</td>
                    <td className="px-6 py-4 text-slate-300">{st.department}</td>
                    <td className="px-6 py-4 text-slate-400">{st.total_sessions} Sesi</td>
                    <td className="px-6 py-4 font-extrabold text-rose-400 text-sm">{st.percentage}%</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                        Peringatan Akademik
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Distribution Progress Bars */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>Distribusi Mahasiswa Berdasarkan Departemen (Student Service)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {Object.entries(departmentStats).map(([dept, pct]) => (
            <div key={dept} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">{dept}</span>
                <span className="font-bold text-cyan-400">{pct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
