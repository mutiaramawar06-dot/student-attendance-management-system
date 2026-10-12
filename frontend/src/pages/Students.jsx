import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StudentService, AttendanceService } from '../services/api';
import { Search, Plus, UserCheck, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('roll'); // 'roll' or 'name'
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    email: '',
    department: 'Teknik Informatika',
    year_of_study: 3,
    gpa: 3.5
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await StudentService.getStudents();
      setStudents(data);
    } catch (e) {
      console.error("Error fetching students:", e);
      setMessage({ type: 'error', text: 'Gagal mengambil data mahasiswa dari Student API.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchStudents();
      return;
    }
    setLoading(true);
    try {
      if (searchType === 'roll') {
        const result = await StudentService.searchByRoll(searchQuery.trim());
        setStudents(result ? [result] : []);
      } else {
        const results = await StudentService.searchByName(searchQuery.trim());
        setStudents(results);
      }
    } catch (e) {
      setStudents([]);
      setMessage({ type: 'error', text: `Tidak ditemukan mahasiswa dengan query "${searchQuery}"` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await StudentService.addStudent(formData);
      setMessage({ type: 'success', text: `Mahasiswa ${formData.name} (${formData.roll_number}) berhasil ditambahkan!` });
      
      // Auto Sync with Attendance Service
      try {
        await AttendanceService.syncStudent(formData);
      } catch (err) {
        console.log("Auto-sync info:", err);
      }

      setShowAddModal(false);
      setFormData({ roll_number: '', name: '', email: '', department: 'Teknik Informatika', year_of_study: 3, gpa: 3.5 });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal menambahkan mahasiswa.' });
    }
  };

  const handleDeleteStudent = async (rollNumber, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus mahasiswa ${name} (${rollNumber})?`)) return;
    try {
      await StudentService.deleteStudent(rollNumber);
      try {
        await AttendanceService.deleteStudent(rollNumber);
      } catch (syncErr) {
        console.warn("Attendance student deletion error:", syncErr);
      }
      setMessage({ type: 'success', text: `Mahasiswa ${name} (${rollNumber}) berhasil dihapus.` });
      fetchStudents();
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal menghapus mahasiswa.' });
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="glass-input text-xs font-semibold py-2.5 bg-slate-800"
          >
            <option value="roll">Cari Berdasarkan NIM</option>
            <option value="name">Cari Berdasarkan Nama</option>
          </select>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchType === 'roll' ? 'Masukkan NIM (contoh: 220101)...' : 'Masukkan Nama...'}
              className="w-full pl-10 pr-4 py-2 glass-input text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all">
            Cari
          </button>
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); fetchStudents(); }} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
              Reset
            </button>
          )}
        </form>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mahasiswa (Admin)</span>
        </button>
      </div>

      {/* Message Banner */}
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

      {/* Student Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-200 text-sm">Daftar Mahasiswa (Student Management System API)</h3>
          <span className="text-xs text-indigo-400 font-semibold">{students.length} Mahasiswa Ditampilkan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Memuat data mahasiswa...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Tidak ada mahasiswa yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">NIM / Roll</th>
                  <th className="px-6 py-4">Nama Mahasiswa</th>
                  <th className="px-6 py-4">Departemen / Jurusan</th>
                  <th className="px-6 py-4">Tahun</th>
                  <th className="px-6 py-4">IPK / GPA</th>
                  <th className="px-6 py-4 text-center">Aksi / Detail Integrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((st) => (
                  <tr key={st.id || st.roll_number} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-400">{st.roll_number}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-200">{st.name}</p>
                        <p className="text-xs text-slate-500">{st.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-300">{st.department}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">Tahun ke-{st.year_of_study}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">{st.gpa?.toFixed(2) || '3.50'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/students/${st.roll_number}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/40 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail Terintegrasi</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteStudent(st.roll_number, st.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/30 transition-all"
                          title="Hapus Mahasiswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-lg p-6 bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-lg">Tambah Mahasiswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">NIM / Roll Number (Unik)</label>
                <input
                  type="text"
                  required
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  placeholder="Contoh: 220106"
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama mahasiswa"
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@univ.ac.id"
                  className="w-full glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Departemen</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full glass-input text-sm bg-slate-900"
                  >
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Teknik Komputer">Teknik Komputer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">IPK (GPA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.00"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: parseFloat(e.target.value) })}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/30"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
