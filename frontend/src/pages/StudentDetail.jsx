import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StudentService, AttendanceService } from '../services/api';
import { ArrowLeft, User, Mail, GraduationCap, Percent, Calendar, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Plus, Trash2, Clock, XCircle } from 'lucide-react';

export const StudentDetail = () => {
  const { rollNumber } = useParams();
  const [studentProfile, setStudentProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ synced: false, checking: true });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Quick attendance modal state
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [submittingMark, setSubmittingMark] = useState(false);
  const [markForm, setMarkForm] = useState({
    status: 'PRESENT',
    date: new Date().toISOString().split('T')[0],
    courseName: 'Cloud Computing',
    remarks: 'Hadir'
  });
  const [markError, setMarkError] = useState('');

  const loadIntegratedData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile from Student Management API (FastAPI)
      const profile = await StudentService.searchByRoll(rollNumber);
      setStudentProfile(profile);

      // 2. Fetch Attendance Info from Attendance API (Spring Boot)
      const attendanceStudent = await AttendanceService.getStudentByRoll(rollNumber);
      
      if (attendanceStudent) {
        setSyncStatus({ synced: true, checking: false });
        const stats = await AttendanceService.getStudentPercentage(rollNumber);
        const history = await AttendanceService.getStudentHistory(rollNumber);
        setAttendanceStats(stats);
        setAttendanceHistory(Array.isArray(history) ? [...history].reverse() : []);
      } else {
        setSyncStatus({ synced: false, checking: false });
        setAttendanceStats(null);
        setAttendanceHistory([]);
      }
    } catch (e) {
      console.error("Error loading integrated detail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegratedData();
  }, [rollNumber]);

  const handleSyncToAttendance = async () => {
    if (!studentProfile) return;
    setSyncing(true);
    setMessage({ type: '', text: '' });
    try {
      await AttendanceService.syncStudent({
        roll_number: studentProfile.roll_number,
        rollNumber: studentProfile.roll_number,
        name: studentProfile.name,
        email: studentProfile.email,
        department: studentProfile.department
      });
      setMessage({ type: 'success', text: 'Identitas mahasiswa berhasil disinkronkan ke Attendance Service!' });
      await loadIntegratedData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal menyinkronkan identitas ke Attendance Service.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleQuickMarkAttendance = async (e) => {
    e.preventDefault();
    setMarkError('');
    setSubmittingMark(true);
    try {
      // Make sure student identity is synced first
      await AttendanceService.syncStudent({
        roll_number: studentProfile.roll_number,
        rollNumber: studentProfile.roll_number,
        name: studentProfile.name,
        email: studentProfile.email,
        department: studentProfile.department
      });

      // Submit attendance record
      await AttendanceService.markAttendance({
        rollNumber: studentProfile.roll_number,
        status: markForm.status,
        date: markForm.date,
        courseName: markForm.courseName,
        remarks: markForm.remarks
      });

      setMessage({ type: 'success', text: `Presensi tanggal ${markForm.date} untuk ${studentProfile.name} berhasil dicatat!` });
      setShowMarkModal(false);
      await loadIntegratedData();
    } catch (err) {
      const errMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || err.message || 'Gagal mencatat presensi.';
      setMarkError(errMsg);
    } finally {
      setSubmittingMark(false);
    }
  };

  const handleDeleteRecord = async (recordId, date) => {
    if (!window.confirm(`Hapus catatan presensi tanggal ${date}?`)) return;
    try {
      await AttendanceService.deleteAttendanceRecord(recordId);
      setMessage({ type: 'success', text: 'Catatan presensi berhasil dihapus.' });
      await loadIntegratedData();
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal menghapus catatan presensi.' });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
        <span>Memuat profil terintegrasi mahasiswa...</span>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="p-8 max-w-4xl mx-auto glass-card text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-200">Mahasiswa Tidak Ditemukan</h3>
        <p className="text-slate-400 text-sm">Tidak dapat menemukan profil dengan NIM: {rollNumber}</p>
        <Link to="/students" className="inline-flex items-center gap-2 text-indigo-400 font-semibold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Mahasiswa
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Back Button & Sync */}
      <div className="flex items-center justify-between">
        <Link to="/students" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Mahasiswa
        </Link>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-3">
          {syncStatus.synced ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Identitas Terintegrasi Lintas Service</span>
            </span>
          ) : (
            <button
              onClick={handleSyncToAttendance}
              disabled={syncing}
              className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkronkan Identitas ke Attendance Service'}</span>
            </button>
          )}

          <button
            onClick={() => { setMarkError(''); setShowMarkModal(true); }}
            className="px-4 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Presensi Mahasiswa Ini</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Cross-System Integration Header Banner */}
      <div className="glass-card p-8 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border-l-4 border-l-indigo-500">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-xl shadow-indigo-500/20">
              {studentProfile.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold text-slate-100">{studentProfile.name}</h2>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  NIM: {studentProfile.roll_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>{studentProfile.department}</span>
                <span>•</span>
                <span>Tahun Ke-{studentProfile.year_of_study}</span>
                <span>•</span>
                <span>IPK: {studentProfile.gpa?.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Persentase Kehadiran</span>
            <span className={`font-extrabold mt-1 block ${
              !syncStatus.synced || !attendanceStats || attendanceStats.total_sessions === 0
                ? 'text-slate-400 text-2xl'
                : attendanceStats.attendance_percentage >= 75
                ? 'text-emerald-400 text-4xl'
                : 'text-rose-400 text-4xl'
            }`}>
              {!syncStatus.synced || !attendanceStats || attendanceStats.total_sessions === 0
                ? 'Belum Ada Sesi'
                : `${attendanceStats.attendance_percentage}%`}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {attendanceStats?.total_sessions ? `${attendanceStats.total_sessions} Sesi Pertemuan` : '0 Sesi Tercatat'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Profile API vs Attendance API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Box 1: Data Profil Master (dari Student Management System API) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Sumber Data Profil (Student API - FastAPI)</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">Port 8000</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800/40">
              <span className="text-slate-400">NIM / Roll Number (Key)</span>
              <span className="font-mono font-bold text-indigo-300">{studentProfile.roll_number}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/40">
              <span className="text-slate-400">Nama Lengkap</span>
              <span className="font-semibold text-slate-200">{studentProfile.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/40">
              <span className="text-slate-400">Email Akademik</span>
              <span className="text-slate-300">{studentProfile.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/40">
              <span className="text-slate-400">Departemen / Jurusan</span>
              <span className="text-slate-300">{studentProfile.department}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Tingkat / Tahun</span>
              <span className="text-slate-300">Tahun Ke-{studentProfile.year_of_study}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Data Attendance (dari Attendance Management System API) */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Sumber Data Presensi (Attendance API - Spring Boot)</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">Port 8080</span>
          </div>

          {attendanceStats && attendanceStats.total_sessions > 0 ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs text-slate-400 block">Hadir (Present)</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">{attendanceStats.present_count}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs text-slate-400 block">Terlambat (Late)</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">{attendanceStats.late_count}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-xs text-slate-400 block">Absen (Absent)</span>
                <span className="text-xl font-bold text-rose-400 mt-1 block">{attendanceStats.absent_count}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
              <p>
                {syncStatus.synced
                  ? 'Mahasiswa terdaftar di Attendance, namun belum ada sesi presensi yang dicatat.'
                  : 'Mahasiswa belum memiliki catatan pada Attendance System.'}
              </p>
              <button
                onClick={() => { setMarkError(''); setShowMarkModal(true); }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Presensi Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Pertemuan / Attendance Log Table */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-200 text-sm">Riwayat Presensi Mahasiswa</h3>
          <span className="text-xs text-indigo-400 font-semibold">{attendanceHistory.length} Pertemuan Tercatat</span>
        </div>

        {attendanceHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">Belum ada riwayat kehadiran tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Mata Kuliah</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attendanceHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-300">{rec.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{rec.courseName || 'Cloud Computing'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        rec.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        rec.status === 'LATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {rec.status === 'PRESENT' && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === 'LATE' && <Clock className="w-3 h-3" />}
                        {rec.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                        <span>{rec.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{rec.remarks || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteRecord(rec.id, rec.date)}
                        className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/30 border border-rose-500/20 transition-all"
                        title="Hapus Presensi"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Mark Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Catat Presensi: {studentProfile.name} ({studentProfile.roll_number})</span>
              </h3>
              <button onClick={() => setShowMarkModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {markError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{markError}</span>
              </div>
            )}

            <form onSubmit={handleQuickMarkAttendance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Status Kehadiran</label>
                  <select
                    value={markForm.status}
                    onChange={(e) => {
                      const st = e.target.value;
                      const rem = st === 'PRESENT' ? 'Hadir' : st === 'LATE' ? 'Terlambat' : 'Absen';
                      setMarkForm({ ...markForm, status: st, remarks: rem });
                    }}
                    className="w-full glass-input bg-slate-900 border border-slate-700 py-2"
                  >
                    <option value="PRESENT">HADIR (PRESENT)</option>
                    <option value="LATE">TERLAMBAT (LATE)</option>
                    <option value="ABSENT">ABSEN (ABSENT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={markForm.date}
                    onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })}
                    className="w-full glass-input border border-slate-700 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mata Kuliah</label>
                <input
                  type="text"
                  required
                  value={markForm.courseName}
                  onChange={(e) => setMarkForm({ ...markForm, courseName: e.target.value })}
                  className="w-full glass-input border border-slate-700 py-2"
                  placeholder="Contoh: Cloud Computing"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={markForm.remarks}
                  onChange={(e) => setMarkForm({ ...markForm, remarks: e.target.value })}
                  className="w-full glass-input border border-slate-700 py-2"
                  placeholder="Contoh: Hadir di kelas"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingMark}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  {submittingMark ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Presensi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
