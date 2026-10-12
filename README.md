# 🎓 Integrated Student & Attendance Management System

Aplikasi web terintegrasi untuk pengelolaan data mahasiswa dan presensi berbasis **Cloud Computing Architecture**.

Proyek ini mengintegrasikan dua backend REST API open-source dengan satu antarmuka **React Frontend** yang terpadu:
1. **Student Management System v2** (FastAPI / Python / PostgreSQL)
2. **Attendance Management System** (Spring Boot / Java 17 / MySQL)
3. **Integrated Modern Frontend** (React + Vite + Axios + Tailwind CSS)

---

## 🏛️ Arsitektur Sistem

```
                                +-----------------------------------+
                                |    React Frontend (Port 3000)     |
                                |   Vite + Axios + Tailwind CSS     |
                                +-----------------+-----------------+
                                                  |
                           +----------------------+----------------------+
                           |                                             |
                           v                                             v
         +-----------------------------------+         +-----------------------------------+
         |    FastAPI Student Management     |         | Spring Boot Attendance Management |
         |           (Port 8000)             |         |           (Port 8080)             |
         +-----------------+-----------------+         +-----------------+-----------------+
                           |                                             |
                           v                                             v
         +-----------------------------------+         +-----------------------------------+
         |        PostgreSQL Database        |         |          MySQL 8 Database         |
         |           (Port 5432)             |         |           (Port 3306)             |
         +-----------------------------------+         +-----------------------------------+
```

### 🔑 Business Key Integrasi: `NIM / Roll Number`
- Integrasi dilakukan pada **Presentation Layer (Frontend)**.
- Saat membuka halaman **Student Detail**, frontend secara paralel mengambil data profil dari **Student API** dan data presensi dari **Attendance API** menggunakan **NIM / Roll Number** sebagai identifier unik lintas service.
- Apabila data mahasiswa belum ada di Attendance Service, sistem menyediakan **Auto-Sync / Registration** langsung dari UI.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi A: Jalankan dengan Docker Compose (Rekomendasi Deployment)

Cukup jalankan satu perintah berikut di root repositori:

```bash
docker-compose up --build
```

Setelah semua container aktif, akses aplikasi melalui browser:
- **Frontend App**: `http://localhost:3000`
- **Student API (FastAPI Swagger)**: `http://localhost:8000/docs`
- **Attendance API (Spring Boot Swagger)**: `http://localhost:8080/swagger-ui.html`

---

### Opsi B: Jalankan Secara Lokal (Tanpa Docker)

#### 1. Jalankan Student Management Backend (FastAPI)
```bash
cd student-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### 2. Jalankan Attendance Management Backend
- **Dengan Spring Boot (Java 17)**:
  ```bash
  cd attendance-backend
  mvn spring-boot:run
  ```
- **Atau dengan Runner Python (Fallback Instant)**:
  ```bash
  cd attendance-backend
  pip install -r requirements.txt
  uvicorn app:app --reload --port 8080
  ```

#### 3. Jalankan React Frontend
```bash
cd frontend
npm install
npm run dev
```
Akses frontend di `http://localhost:5173`.

---

## 🔐 Kredensial Login Demo Default

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `Admin`

---

## 📡 Dokumentasi Endpoint REST API

### 1. Student Management API (FastAPI - Port 8000)
| Method | Endpoint | Kegunaan |
|---|---|---|
| `POST` | `/auth/register` | Registrasi user baru |
| `POST` | `/auth/login` | Login dan memperoleh JWT Access Token |
| `GET` | `/auth/is_auth` | Validasi token otentikasi |
| `GET` | `/student/view_students` | Mengambil seluruh data mahasiswa |
| `GET` | `/student/search_by_roll` | Mencari mahasiswa berdasarkan NIM |
| `GET` | `/student/search_by_name` | Mencari mahasiswa berdasarkan Nama |
| `GET` | `/student/percent_student` | Mendapatkan persentase distribusi mahasiswa |
| `POST` | `/admin/add_students` | Menambah mahasiswa baru |
| `DELETE` | `/admin/delete_students` | Menghapus data mahasiswa |

### 2. Attendance Management API (Spring Boot - Port 8080)
| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/api/students` | Mengambil daftar mahasiswa di service Attendance |
| `GET` | `/api/students/{id}` | Detail mahasiswa berdasarkan ID local |
| `GET` | `/api/students/roll/{rollNumber}` | Mencari mahasiswa berdasarkan NIM |
| `POST` | `/api/students` | Mendaftarkan / Sync data mahasiswa ke Attendance DB |
| `POST` | `/api/attendance` | Mencatat presensi single |
| `POST` | `/api/attendance/bulk` | Mencatat presensi bulk untuk seluruh kelas |
| `GET` | `/api/attendance/student/{id}` | Riwayat presensi mahasiswa |
| `GET` | `/api/attendance/student/{id}/percentage` | Persentase statistik kehadiran mahasiswa |
| `GET` | `/api/attendance/report/monthly` | Laporan ringkasan kehadiran bulanan |
| `GET` | `/api/attendance/report/low-attendance` | Daftar mahasiswa dengan kehadiran &lt; 75% |

---

## 🎬 Skenario Pengujian Presentasi (PRD Section 31)

1. **Login**: Buka frontend, login menggunakan akun `admin` / `admin123`.
2. **Dashboard**: Tampilkan ringkasan statistik mahasiswa, total presensi, dan mahasiswa low attendance.
3. **Daftar Mahasiswa**: Buka menu **Students**, lakukan pencarian mahasiswa berdasarkan NIM (misal: `220101`).
4. **Detail Terintegrasi**: Klik **Detail Terintegrasi** pada salah satu mahasiswa. Perhatikan bahwa **Data Profil** diambil dari **Student API (Port 8000)** dan **Data Presensi** diambil dari **Attendance API (Port 8080)**.
5. **Catat Attendance**: Buka menu **Presensi (Attendance)**, tambahkan catatan presensi baru.
6. **Refresh Detail**: Kembali ke halaman Student Detail, perhatikan bahwa persentase dan riwayat presensi langsung diperbarui.
7. **Laporan**: Buka menu **Laporan (Reports)**, atur slider ambang batas Low Attendance (misal 80%), dan lihat daftar mahasiswa yang dievaluasi.
8. **Swagger API**: Buka `http://localhost:8000/docs` dan `http://localhost:8080/swagger-ui.html` untuk mendemonstrasikan dokumentasi API.

---

## 📦 Deliverables Proyek
- [x] Source code Student Management System (`/student-backend`)
- [x] Source code Attendance Management System (`/attendance-backend`)
- [x] Source code React Frontend (`/frontend`)
- [x] Dockerfile & Docker Compose (`docker-compose.yml`)
- [x] Dokumentasi API & Panduan Integrasi (`README.md`)
