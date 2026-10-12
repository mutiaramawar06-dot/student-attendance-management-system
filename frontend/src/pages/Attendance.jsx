import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AttendanceService, StudentService } from '../services/api';
import { Calendar, Plus, CheckCircle2, Clock, XCircle, Users, RefreshCw, AlertCircle, Trash2, Search, Filter } from 'lucide-react';

export const Attendance = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markType, setMarkType] = useState('single'); // 'single' or 'bulk'
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  
  // Table search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Single mark form
  const [singleForm, setSingleForm] = useState({
    rollNumber: '',
    status: 'PRESENT',
    date: new Date().toISOString().split('T')[0],
    courseName: 'Cloud Computing',
    remarks: 'Hadir'
  });

  // Bulk mark form
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkCourse, setBulkCourse] = useState('Cloud Computing');
  const [bulkStatusMap, setBulkStatusMap] = useState({});

  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    setLoading(true);
    let recs = [];
    let sts = [];

    try {
      sts = await StudentService.getStudents();
    } catch (e) {
      console.error("Error fetching students:", e);
    }

    try {
      recs = await AttendanceService.getAllRecords();
    } catch (e) {
      console.warn("Backend Attendance (Port 8080) error:", e);
    }

    const fetchedRecords = Array.isArray(recs) ? [...recs].reverse() : [];
    const fetchedStudents = Array.isArray(sts) ? sts : [];
    
    setRecords(fetchedRecords);
    setStudents(fetchedStudents);

    if (fetchedStudents.length > 0) {
      const initialMap = {};
      fetchedStudents.forEach(st => {
        initialMap[st.roll_number] = 'PRESENT';
      });
      setBulkStatusMap(initialMap);

      // Auto-populate singleForm if not set
      setSingleForm(prev => {
        if (!prev.rollNumber && fetchedStudents[0]?.roll_number) {
          return { ...prev, rollNumber: fetchedStudents[0].roll_number };
        }
        return prev;
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openMarkModal = () => {
    setModalError('');
    if (students.length > 0 && !singleForm.rollNumber) {
      setSingleForm(prev => ({
        ...prev,
        rollNumber: students[0].roll_number
      }));
    }
    setShowMarkModal(true);
  };

  const handleMarkSingle = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!singleForm.rollNumber) {
      setModalError('Silakan pilih salah satu mahasiswa terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sync student profile to Attendance service
      const stProfile = students.find(s => s.roll_number === singleForm.rollNumber);
      if (stProfile) {
        await AttendanceService.syncStudent(stProfile);
      }

      // 2. Mark attendance
      await AttendanceService.markAttendance(singleForm);

      setMessage({ type: 'success', text: `Presensi mahasiswa NIM ${singleForm.rollNumber} berhasil dicatat!` });
      setShowMarkModal(false);
      fetchData();
    } catch (err) {
      console.error("Gagal mencatat presensi single:", err);
      const backendErr = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || err.response?.data?.detail;
      const errMsg = backendErr || err.message || 'Gagal mencatat presensi.';
      setModalError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkBulk = async (e) => {
    e.preventDefault();
    setModalError('');

    if (students.length === 0) {
      setModalError('Tidak ada data mahasiswa untuk dicatat secara bulk.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sync all students to Attendance service in parallel
      await Promise.all(students.map(st => AttendanceService.syncStudent(st)));

      // 2. Prepare bulk payload
      const bulkRecords = students.map(st => {
        const status = bulkStatusMap[st.roll_number] || 'PRESENT';
        return {
          rollNumber: st.roll_number,
          status: status,
          remarks: status === 'PRESENT' ? 'Hadir' : status === 'LATE' ? 'Terlambat' : 'Absen'
        };
      });

      await AttendanceService.markAttendanceBulk({
        date: bulkDate,
        courseName: bulkCourse,
        records: bulkRecords
      });

      setMessage({ type: 'success', text: `Presensi bulk untuk ${bulkRecords.length} mahasiswa berhasil disimpan!` });
      setShowMarkModal(false);
      fetchData();
    } catch (err) {
      console.error("Gagal mencatat presensi bulk:", err);
      const backendErr = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || err.response?.data?.detail;
      const errMsg = backendErr || err.message || 'Gagal melakukan presensi bulk.';
      setModalError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId, studentName, date) => {
    if (!window.confirm(`Hapus catatan presensi ${studentName} pada tanggal ${date}?`)) {
      return;
    }

    try {
      await AttendanceService.deleteAttendanceRecord(recordId);
      setMessage({ type: 'success', text: `Catatan presensi berhasil dihapus.` });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menghapus catatan presensi.' });
    }
  };

  // Filtered attendance records
  const filteredRecords = records.filter(rec => {
    const studentName = rec.student?.name || '';
    const rollNumber = rec.student?.rollNumber || rec.student?.roll_number || '';
    const course = rec.courseName || '';
    const searchMatch = !searchTerm.trim() || 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'ALL' || rec.status === statusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <span>Manajemen Presensi (Attendance Service)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Pencatatan dan riwayat kehadiran mahasiswa secara real-time antar-service</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openMarkModal}
            id="btn-open-mark-attendance"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Attendance Baru</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, NIM, atau mata kuliah..."
            className="w-full pl-10 pr-4 py-2 glass-input text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs font-semibold py-2 px-3 bg-slate-800"
          >
            <option value="ALL">Semua Status</option>
            <option value="PRESENT">Hadir (PRESENT)</option>
            <option value="LATE">Terlambat (LATE)</option>
            <option value="ABSENT">Absen (ABSENT)</option>
          </select>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-200 text-sm">Riwayat Catatan Presensi Terkini</h3>
          <span className="text-xs text-cyan-400 font-semibold">{filteredRecords.length} Catatan Presensi Ditampilkan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Memuat data presensi...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
            <p>Belum ada data presensi yang sesuai dengan kriteria.</p>
            {records.length === 0 && (
              <button
                onClick={openMarkModal}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Catat presensi pertama Anda sekarang
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Nama Mahasiswa (NIM)</th>
                  <th className="px-6 py-4">Mata Kuliah</th>
                  <th className="px-6 py-4">Status Presensi</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{rec.date}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-200">{rec.student?.name || 'Mahasiswa'}</p>
                        <p className="text-xs text-indigo-400 font-mono">NIM: {rec.student?.rollNumber || rec.student?.roll_number || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">{rec.courseName || 'Cloud Computing'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1.5 ${
                        rec.status === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        rec.status === 'LATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {rec.status === 'PRESENT' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {rec.status === 'LATE' && <Clock className="w-3.5 h-3.5" />}
                        {rec.status === 'ABSENT' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{rec.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{rec.remarks || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteRecord(rec.id, rec.student?.name || 'Mahasiswa', rec.date)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 transition-all"
                        title="Hapus Catatan Presensi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Attendance Modal (Single & Bulk support) */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-2xl p-6 bg-slate-900 border border-slate-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>Catat Presensi (Attendance)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMarkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Error banner inside modal */}
            {modalError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            {/* If no students exist */}
            {students.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                <span>Belum ada data mahasiswa terdaftar di sistem.</span>
                <Link to="/students" className="font-bold underline hover:text-amber-200">
                  Tambah Mahasiswa &rarr;
                </Link>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex bg-slate-800/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setMarkType('single'); setModalError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  markType === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Single Presensi Per Mahasiswa
              </button>
              <button
                type="button"
                onClick={() => { setMarkType('bulk'); setModalError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  markType === 'bulk' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bulk Presensi Seluruh Kelas
              </button>
            </div>

            {markType === 'single' ? (
              <form onSubmit={handleMarkSingle} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">
                    Pilih Mahasiswa <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={singleForm.rollNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, rollNumber: e.target.value })}
                    className="w-full glass-input text-sm bg-slate-900 border border-slate-700"
                  >
                    <option value="">-- Pilih Mahasiswa (NIM) --</option>
                    {students.map(st => (
                      <option key={st.roll_number} value={st.roll_number}>
                        {st.name} ({st.roll_number}) - {st.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Status Kehadiran</label>
                    <select
                      value={singleForm.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        const defaultRemark = newStatus === 'PRESENT' ? 'Hadir' : newStatus === 'LATE' ? 'Terlambat' : 'Absen';
                        setSingleForm({ ...singleForm, status: newStatus, remarks: defaultRemark });
                      }}
                      className="w-full glass-input text-sm bg-slate-900 border border-slate-700"
                    >
                      <option value="PRESENT">HADIR (PRESENT)</option>
                      <option value="LATE">TERLAMBAT (LATE)</option>
                      <option value="ABSENT">ABSEN (ABSENT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={singleForm.date}
                      onChange={(e) => setSingleForm({ ...singleForm, date: e.target.value })}
                      className="w-full glass-input text-sm border border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={singleForm.courseName}
                    onChange={(e) => setSingleForm({ ...singleForm, courseName: e.target.value })}
                    className="w-full glass-input text-sm border border-slate-700"
                    placeholder="Contoh: Cloud Computing"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Keterangan / Catatan</label>
                  <input
                    type="text"
                    value={singleForm.remarks}
                    onChange={(e) => setSingleForm({ ...singleForm, remarks: e.target.value })}
                    className="w-full glass-input text-sm border border-slate-700"
                    placeholder="Contoh: Hadir tepat waktu"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    id="btn-submit-single-attendance"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Presensi...</span>
                      </>
                    ) : (
                      <span>Simpan Presensi</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleMarkBulk} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Tanggal Sesi</label>
                    <input
                      type="date"
                      required
                      value={bulkDate}
                      onChange={(e) => setBulkDate(e.target.value)}
                      className="w-full glass-input text-sm border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-1">Mata Kuliah</label>
                    <input
                      type="text"
                      required
                      value={bulkCourse}
                      onChange={(e) => setBulkCourse(e.target.value)}
                      className="w-full glass-input text-sm border border-slate-700"
                      placeholder="Contoh: Cloud Computing"
                    />
                  </div>
                </div>

                <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950/40 max-h-60 overflow-y-auto">
                  <p className="text-xs text-slate-400 font-semibold mb-2">Tentukan Status Presensi Per Mahasiswa:</p>
                  {students.map((st) => (
                    <div key={st.roll_number} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{st.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIM: {st.roll_number}</p>
                      </div>
                      <select
                        value={bulkStatusMap[st.roll_number] || 'PRESENT'}
                        onChange={(e) => setBulkStatusMap({ ...bulkStatusMap, [st.roll_number]: e.target.value })}
                        className="text-xs glass-input py-1 px-2 bg-slate-900 border border-slate-700"
                      >
                        <option value="PRESENT">HADIR</option>
                        <option value="LATE">TERLAMBAT</option>
                        <option value="ABSENT">ABSEN</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowMarkModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    id="btn-submit-bulk-attendance"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Presensi Bulk...</span>
                      </>
                    ) : (
                      <span>Simpan Presensi Bulk ({students.length} Mahasiswa)</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
