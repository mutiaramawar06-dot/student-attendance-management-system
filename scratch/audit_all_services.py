import urllib.request
import json
import sys

def run_test(name, fn):
    try:
        fn()
        print(f" [PASS] {name}")
        return True
    except Exception as e:
        print(f" [FAIL] {name} -> Error: {e}")
        return False

total_tests = 0
passed_tests = 0

print("=" * 60)
print(" AUDIT ULANG INTEGRASI SISTEM & KESIAPAN FITUR (DOCKER)")
print("=" * 60)

# 1. FRONTEND SERVER CHECKS
def test_frontend_home():
    req = urllib.request.Request("http://localhost:3000/")
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        html = res.read().decode()
        assert "<title>" in html
def test_frontend_spa_fallback():
    for route in ["/attendance", "/students", "/reports", "/dashboard"]:
        req = urllib.request.Request(f"http://localhost:3000{route}")
        with urllib.request.urlopen(req) as res:
            assert res.status == 200

# 2. CORS HEADER CHECKS
def test_cors_student_api():
    req = urllib.request.Request("http://localhost:8000/auth/login", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    req.get_method = lambda: "OPTIONS"
    with urllib.request.urlopen(req) as res:
        assert res.status in [200, 204]
        assert "Access-Control-Allow-Origin" in res.headers

def test_cors_attendance_api():
    req = urllib.request.Request("http://localhost:8080/api/attendance", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    req.get_method = lambda: "OPTIONS"
    with urllib.request.urlopen(req) as res:
        assert res.status in [200, 204]
        assert "Access-Control-Allow-Origin" in res.headers

# 3. STUDENT API (FASTAPI)
token = None
def test_student_login():
    global token
    data = json.dumps({"username": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request("http://localhost:8000/auth/login", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        body = json.loads(res.read().decode())
        token = body["access_token"]
        assert token is not None

def test_student_auth_check():
    global token
    req = urllib.request.Request("http://localhost:8000/auth/is_auth", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        body = json.loads(res.read().decode())
        assert body["authenticated"] is True
        assert body["user"]["role"] == "Admin"

def test_student_view_all():
    global token
    req = urllib.request.Request("http://localhost:8000/student/view_students", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert isinstance(data, list)
        assert len(data) > 0

def test_student_search_roll():
    global token
    req = urllib.request.Request("http://localhost:8000/student/search_by_roll?roll_number=220101", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert data["roll_number"] == "220101"

def test_student_search_name():
    global token
    req = urllib.request.Request("http://localhost:8000/student/search_by_name?name=Budi", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert isinstance(data, list)

def test_student_percent_stats():
    global token
    req = urllib.request.Request("http://localhost:8000/student/percent_student", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        assert "department_distribution" in data

# 4. CROSS-SERVICE STUDENT ADD & SYNC
test_roll = "990999"
def test_add_student_lifecycle():
    global token, test_roll
    # Add to FastAPI
    new_student = {
        "roll_number": test_roll,
        "name": "Audit Test Student",
        "email": "audit.test@univ.ac.id",
        "department": "Sistem Informasi",
        "year_of_study": 2,
        "gpa": 3.85
    }
    req = urllib.request.Request("http://localhost:8000/admin/add_students", data=json.dumps(new_student).encode(), headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 201

    # Sync to Attendance API (Dual case support)
    sync_data = {
        "roll_number": test_roll,
        "rollNumber": test_roll,
        "name": new_student["name"],
        "email": new_student["email"],
        "department": new_student["department"]
    }
    req_sync = urllib.request.Request("http://localhost:8080/api/students", data=json.dumps(sync_data).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_sync) as res:
        assert res.status in [200, 201]

    # Verify query by roll in Attendance API
    req_chk = urllib.request.Request(f"http://localhost:8080/api/students/roll/{test_roll}")
    with urllib.request.urlopen(req_chk) as res:
        assert res.status == 200
        b = json.loads(res.read().decode())
        assert b["rollNumber"] == test_roll

created_rec_id = None
def test_attendance_mark_single_and_delete():
    global test_roll, created_rec_id
    payload = {
        "rollNumber": test_roll,
        "roll_number": test_roll,
        "status": "PRESENT",
        "date": "2026-10-12",
        "courseName": "Cloud Computing Audit",
        "remarks": "Hadir pengujian sistem"
    }
    req = urllib.request.Request("http://localhost:8080/api/attendance", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 201
        rec = json.loads(res.read().decode())
        created_rec_id = rec["id"]
        assert rec["status"] == "PRESENT"
        assert rec["courseName"] == "Cloud Computing Audit"

    # Test delete the created record
    req_del = urllib.request.Request(f"http://localhost:8080/api/attendance/{created_rec_id}")
    req_del.get_method = lambda: "DELETE"
    with urllib.request.urlopen(req_del) as res:
        assert res.status == 200

def test_attendance_bulk():
    global test_roll
    payload = {
        "date": "2026-10-12",
        "courseName": "Cloud Computing Bulk",
        "records": [
            {"rollNumber": test_roll, "status": "PRESENT", "remarks": "Hadir"},
            {"rollNumber": "220101", "status": "LATE", "remarks": "Terlambat 10m"}
        ]
    }
    req = urllib.request.Request("http://localhost:8080/api/attendance/bulk", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        assert res.status == 201
        body = json.loads(res.read().decode())
        assert body["total_processed"] >= 1

def test_attendance_reports():
    # Monthly
    with urllib.request.urlopen("http://localhost:8080/api/attendance/report/monthly") as res:
        assert res.status == 200
        body = json.loads(res.read().decode())
        assert "total_records" in body

    # Low attendance
    with urllib.request.urlopen("http://localhost:8080/api/attendance/report/low-attendance?threshold=80") as res:
        assert res.status == 200
        body = json.loads(res.read().decode())
        assert isinstance(body, list)

def test_attendance_percentage():
    with urllib.request.urlopen("http://localhost:8080/api/attendance/student/220101/percentage") as res:
        assert res.status == 200
        body = json.loads(res.read().decode())
        assert "attendance_percentage" in body
        assert "total_sessions" in body

def test_cleanup_test_student():
    global token, test_roll
    # Delete from FastAPI
    req_del = urllib.request.Request(f"http://localhost:8000/admin/delete_students?roll_number={test_roll}", headers={"Authorization": f"Bearer {token}"})
    req_del.get_method = lambda: "DELETE"
    with urllib.request.urlopen(req_del) as res:
        assert res.status == 200

    # Delete from Attendance API
    req_del2 = urllib.request.Request(f"http://localhost:8080/api/students/{test_roll}")
    req_del2.get_method = lambda: "DELETE"
    with urllib.request.urlopen(req_del2) as res:
        assert res.status == 200

tests = [
    ("Frontend Home (Nginx Port 3000)", test_frontend_home),
    ("Frontend SPA Route Fallback (/attendance, /students, etc.)", test_frontend_spa_fallback),
    ("CORS Preflight Student API (Port 8000)", test_cors_student_api),
    ("CORS Preflight Attendance API (Port 8080)", test_cors_attendance_api),
    ("Student API Auth Login (JWT)", test_student_login),
    ("Student API Auth Verify (/auth/is_auth)", test_student_auth_check),
    ("Student API View All Students", test_student_view_all),
    ("Student API Search By Roll", test_student_search_roll),
    ("Student API Search By Name", test_student_search_name),
    ("Student API Department Distribution", test_student_percent_stats),
    ("Lifecycle Tambah & Sinkronisasi Mahasiswa Lintas-Service", test_add_student_lifecycle),
    ("Catat Presensi Single & Hapus Record Presensi", test_attendance_mark_single_and_delete),
    ("Catat Presensi Bulk Seluruh Kelas", test_attendance_bulk),
    ("Laporan Bulanan & Ambang Batas Kehadiran", test_attendance_reports),
    ("Kalkulasi Persentase Kehadiran Mahasiswa", test_attendance_percentage),
    ("Cleanup Data Uji", test_cleanup_test_student),
]

for name, fn in tests:
    total_tests += 1
    if run_test(name, fn):
        passed_tests += 1

print("=" * 60)
print(f" HASIL AUDIT: {passed_tests}/{total_tests} PENGUJIAN LULUS ({(passed_tests/total_tests)*100:.1f}%)")
print("=" * 60)
