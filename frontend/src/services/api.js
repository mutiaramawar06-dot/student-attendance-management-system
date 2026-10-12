import axios from 'axios';

const STUDENT_API_BASE = import.meta.env.VITE_STUDENT_API_URL || 'http://127.0.0.1:8000';
const ATTENDANCE_API_BASE = import.meta.env.VITE_ATTENDANCE_API_URL || 'http://127.0.0.1:8080';

// Student API Axios Instance
export const studentApi = axios.create({
  baseURL: STUDENT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attendance API Axios Instance
export const attendanceApi = axios.create({
  baseURL: ATTENDANCE_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Student API to attach JWT token
studentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Helper Methods
export const StudentService = {
  login: async (username, password) => {
    const res = await studentApi.post('/auth/login', { username, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await studentApi.post('/auth/register', userData);
    return res.data;
  },
  checkAuth: async () => {
    const res = await studentApi.get('/auth/is_auth');
    return res.data;
  },
  getStudents: async () => {
    const res = await studentApi.get('/student/view_students');
    return res.data;
  },
  searchByRoll: async (rollNumber) => {
    const res = await studentApi.get(`/student/search_by_roll`, { params: { roll_number: rollNumber } });
    return res.data;
  },
  searchByName: async (name) => {
    const res = await studentApi.get(`/student/search_by_name`, { params: { name } });
    return res.data;
  },
  getPercentStudent: async () => {
    const res = await studentApi.get('/student/percent_student');
    return res.data;
  },
  addStudent: async (studentData) => {
    const res = await studentApi.post('/admin/add_students', studentData);
    return res.data;
  },
  deleteStudent: async (rollNumber) => {
    const res = await studentApi.delete(`/admin/delete_students`, { params: { roll_number: rollNumber } });
    return res.data;
  }
};

export const AttendanceService = {
  getStudents: async () => {
    const res = await attendanceApi.get('/api/students');
    return res.data;
  },
  getStudentByRoll: async (rollNumber) => {
    try {
      const res = await attendanceApi.get(`/api/students/roll/${rollNumber}`);
      return res.data;
    } catch (e) {
      return null;
    }
  },
  syncStudent: async (studentData) => {
    const rollNo = studentData.roll_number || studentData.rollNumber;
    const res = await attendanceApi.post('/api/students', {
      roll_number: rollNo,
      rollNumber: rollNo,
      name: studentData.name,
      email: studentData.email,
      department: studentData.department
    });
    return res.data;
  },
  getAllRecords: async () => {
    const res = await attendanceApi.get('/api/attendance');
    return res.data;
  },
  markAttendance: async (recordData) => {
    const rollNo = recordData.rollNumber || recordData.roll_number;
    const res = await attendanceApi.post('/api/attendance', {
      ...recordData,
      rollNumber: rollNo,
      roll_number: rollNo,
      courseName: recordData.courseName || recordData.course_name || 'Cloud Computing',
      course_name: recordData.courseName || recordData.course_name || 'Cloud Computing'
    });
    return res.data;
  },
  markAttendanceBulk: async (bulkData) => {
    const res = await attendanceApi.post('/api/attendance/bulk', {
      date: bulkData.date,
      courseName: bulkData.courseName || bulkData.course_name || 'Cloud Computing',
      course_name: bulkData.courseName || bulkData.course_name || 'Cloud Computing',
      records: (bulkData.records || []).map(r => ({
        ...r,
        rollNumber: r.rollNumber || r.roll_number,
        roll_number: r.rollNumber || r.roll_number
      }))
    });
    return res.data;
  },
  deleteAttendanceRecord: async (id) => {
    const res = await attendanceApi.delete(`/api/attendance/${id}`);
    return res.data;
  },
  getStudentHistory: async (identifier) => {
    try {
      const res = await attendanceApi.get(`/api/attendance/student/${identifier}`);
      return res.data;
    } catch (e) {
      return [];
    }
  },
  getStudentPercentage: async (identifier) => {
    try {
      const res = await attendanceApi.get(`/api/attendance/student/${identifier}/percentage`);
      return res.data;
    } catch (e) {
      return { attendance_percentage: 0, total_sessions: 0, present_count: 0, late_count: 0, absent_count: 0 };
    }
  },
  getMonthlyReport: async () => {
    const res = await attendanceApi.get('/api/attendance/report/monthly');
    return res.data;
  },
  getLowAttendanceReport: async (threshold = 75.0) => {
    const res = await attendanceApi.get('/api/attendance/report/low-attendance', { params: { threshold } });
    return res.data;
  },
  deleteStudent: async (rollNumber) => {
    try {
      const res = await attendanceApi.delete(`/api/students/${rollNumber}`);
      return res.data;
    } catch (e) {
      return null;
    }
  }
};
