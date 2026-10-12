import os
import datetime
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class StudentLocal(Base):
    __tablename__ = "attendance_students"
    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    department = Column(String, nullable=True)

class AttendanceRecordDB(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("attendance_students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False) # PRESENT, ABSENT, LATE
    course_name = Column(String, default="Cloud Computing")
    remarks = Column(String, default="-")

    student = relationship("StudentLocal")

Base.metadata.create_all(bind=engine)

def seed_attendance():
    db = SessionLocal()
    try:
        if db.query(StudentLocal).count() == 0:
            s1 = StudentLocal(roll_number="220101", name="Budi Santoso", email="budi@student.univ.ac.id", department="Teknik Informatika")
            s2 = StudentLocal(roll_number="220102", name="Siti Rahma", email="siti@student.univ.ac.id", department="Sistem Informasi")
            s3 = StudentLocal(roll_number="220103", name="Andi Wijaya", email="andi@student.univ.ac.id", department="Teknik Komputer")
            s4 = StudentLocal(roll_number="220104", name="Dewi Lestari", email="dewi@student.univ.ac.id", department="Teknik Informatika")
            s5 = StudentLocal(roll_number="220105", name="Eko Prasetyo", email="eko@student.univ.ac.id", department="Sistem Informasi")
            db.add_all([s1, s2, s3, s4, s5])
            db.commit()

            today = datetime.date.today()
            recs = [
                AttendanceRecordDB(student_id=s1.id, date=today - datetime.timedelta(days=4), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s1.id, date=today - datetime.timedelta(days=3), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s1.id, date=today - datetime.timedelta(days=2), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s1.id, date=today - datetime.timedelta(days=1), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s1.id, date=today, status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),

                AttendanceRecordDB(student_id=s2.id, date=today - datetime.timedelta(days=2), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s2.id, date=today - datetime.timedelta(days=1), status="LATE", course_name="Cloud Computing", remarks="Terlambat 10m"),
                AttendanceRecordDB(student_id=s2.id, date=today, status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),

                AttendanceRecordDB(student_id=s3.id, date=today - datetime.timedelta(days=2), status="ABSENT", course_name="Cloud Computing", remarks="Sakit"),
                AttendanceRecordDB(student_id=s3.id, date=today - datetime.timedelta(days=1), status="ABSENT", course_name="Cloud Computing", remarks="Tanpa Ket"),
                AttendanceRecordDB(student_id=s3.id, date=today, status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),

                AttendanceRecordDB(student_id=s4.id, date=today - datetime.timedelta(days=1), status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),
                AttendanceRecordDB(student_id=s4.id, date=today, status="PRESENT", course_name="Cloud Computing", remarks="Hadir"),

                AttendanceRecordDB(student_id=s5.id, date=today - datetime.timedelta(days=3), status="ABSENT", course_name="Cloud Computing", remarks="Tanpa Ket"),
                AttendanceRecordDB(student_id=s5.id, date=today - datetime.timedelta(days=2), status="ABSENT", course_name="Cloud Computing", remarks="Tanpa Ket"),
                AttendanceRecordDB(student_id=s5.id, date=today - datetime.timedelta(days=1), status="ABSENT", course_name="Cloud Computing", remarks="Tanpa Ket"),
                AttendanceRecordDB(student_id=s5.id, date=today, status="LATE", course_name="Cloud Computing", remarks="Terlambat 20m"),
            ]
            db.add_all(recs)
            db.commit()
    except Exception as e:
        print("Attendance seed error:", e)
        db.rollback()
    finally:
        db.close()

seed_attendance()

app = FastAPI(title="Attendance Management System API", description="Spring Boot / FastAPI Compatible Attendance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_date(date_str: Optional[str]) -> datetime.date:
    if not date_str:
        return datetime.date.today()
    try:
        clean = str(date_str).split("T")[0].split(" ")[0]
        return datetime.date.fromisoformat(clean)
    except Exception:
        return datetime.date.today()

class StudentSchema(BaseModel):
    roll_number: Optional[str] = None
    rollNumber: Optional[str] = None
    name: str
    email: Optional[str] = None
    department: Optional[str] = None

class MarkAttendanceSchema(BaseModel):
    studentId: Optional[int] = None
    rollNumber: Optional[str] = None
    status: Optional[str] = "PRESENT"
    date: Optional[str] = None
    courseName: Optional[str] = "Cloud Computing"
    remarks: Optional[str] = "-"

class BulkAttendanceSchema(BaseModel):
    date: Optional[str] = None
    courseName: Optional[str] = "Cloud Computing"
    records: List[MarkAttendanceSchema]

@app.get("/api/students")
def get_students():
    db = SessionLocal()
    st = db.query(StudentLocal).all()
    db.close()
    return st

@app.get("/api/students/{id}")
def get_student_by_id(id: int):
    db = SessionLocal()
    st = db.query(StudentLocal).filter(StudentLocal.id == id).first()
    db.close()
    if not st:
        raise HTTPException(status_code=404, detail="Student tidak ditemukan")
    return st

@app.get("/api/students/roll/{roll_number}")
def get_student_by_roll(roll_number: str):
    db = SessionLocal()
    st = db.query(StudentLocal).filter(StudentLocal.roll_number == roll_number).first()
    db.close()
    if not st:
        raise HTTPException(status_code=404, detail="Student tidak ditemukan")
    return st

@app.post("/api/students", status_code=201)
def create_or_sync_student(data: StudentSchema):
    db = SessionLocal()
    target_roll = data.roll_number or data.rollNumber
    if not target_roll:
        db.close()
        raise HTTPException(status_code=400, detail="roll_number / rollNumber wajib diisi")
    
    existing = db.query(StudentLocal).filter(StudentLocal.roll_number == target_roll).first()
    if existing:
        existing.name = data.name
        if data.email: existing.email = data.email
        if data.department: existing.department = data.department
        db.commit()
        db.refresh(existing)
        db.close()
        return existing
    
    new_st = StudentLocal(roll_number=target_roll, name=data.name, email=data.email, department=data.department)
    db.add(new_st)
    db.commit()
    db.refresh(new_st)
    db.close()
    return new_st

@app.delete("/api/students/{roll_number}")
def delete_student(roll_number: str):
    db = SessionLocal()
    st = db.query(StudentLocal).filter(StudentLocal.roll_number == roll_number).first()
    if not st and roll_number.isdigit():
        st = db.query(StudentLocal).filter(StudentLocal.id == int(roll_number)).first()
    if not st:
        db.close()
        return {"message": "Mahasiswa tidak ditemukan di Attendance DB"}
    
    db.query(AttendanceRecordDB).filter(AttendanceRecordDB.student_id == st.id).delete()
    db.delete(st)
    db.commit()
    db.close()
    return {"message": f"Mahasiswa {roll_number} dan catatan presensinya berhasil dihapus"}

@app.get("/api/attendance")
def get_all_attendance():
    db = SessionLocal()
    recs = db.query(AttendanceRecordDB).all()
    res = []
    for r in recs:
        res.append({
            "id": r.id,
            "student": {"id": r.student.id, "rollNumber": r.student.roll_number, "name": r.student.name, "email": r.student.email, "department": r.student.department},
            "date": r.date.isoformat(),
            "status": r.status,
            "courseName": r.course_name,
            "remarks": r.remarks
        })
    db.close()
    return res

@app.post("/api/attendance", status_code=201)
def mark_attendance(data: MarkAttendanceSchema):
    db = SessionLocal()
    st = None
    if data.studentId:
        st = db.query(StudentLocal).filter(StudentLocal.id == data.studentId).first()
    if not st and data.rollNumber:
        st = db.query(StudentLocal).filter(StudentLocal.roll_number == data.rollNumber).first()
    
    if not st:
        db.close()
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan pada service Attendance")
    
    st_id = st.id
    st_roll = st.roll_number
    st_name = st.name

    rec_date = parse_date(data.date)
    rec = AttendanceRecordDB(
        student_id=st_id,
        date=rec_date,
        status=(data.status or "PRESENT").upper(),
        course_name=data.courseName or "Cloud Computing",
        remarks=data.remarks or "-"
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    
    res = {
        "id": rec.id,
        "student": {"id": st_id, "rollNumber": st_roll, "name": st_name},
        "date": rec.date.isoformat(),
        "status": rec.status,
        "courseName": rec.course_name,
        "remarks": rec.remarks
    }
    db.close()
    return res

@app.post("/api/attendance/bulk", status_code=201)
def mark_attendance_bulk(data: BulkAttendanceSchema):
    db = SessionLocal()
    saved = []
    rec_date = parse_date(data.date)

    for item in data.records:
        st = None
        if item.studentId:
            st = db.query(StudentLocal).filter(StudentLocal.id == item.studentId).first()
        if not st and item.rollNumber:
            st = db.query(StudentLocal).filter(StudentLocal.roll_number == item.rollNumber).first()
        
        if st:
            rec = AttendanceRecordDB(
                student_id=st.id,
                date=rec_date,
                status=(item.status or "PRESENT").upper(),
                course_name=data.courseName or "Cloud Computing",
                remarks=item.remarks or "-"
            )
            db.add(rec)
            saved.append(rec)
    
    db.commit()
    count = len(saved)
    db.close()
    return {"message": "Berhasil mencatat attendance secara bulk", "total_processed": count}

@app.get("/api/attendance/student/{identifier}")
def get_student_attendance_history(identifier: str):
    db = SessionLocal()
    st = None
    if identifier.isdigit():
        st = db.query(StudentLocal).filter(StudentLocal.id == int(identifier)).first()
    if not st:
        st = db.query(StudentLocal).filter(StudentLocal.roll_number == identifier).first()
    
    if not st:
        db.close()
        return []
    
    recs = db.query(AttendanceRecordDB).filter(AttendanceRecordDB.student_id == st.id).all()
    res = []
    for r in recs:
        res.append({
            "id": r.id,
            "student": {"id": st.id, "rollNumber": st.roll_number, "name": st.name},
            "date": r.date.isoformat(),
            "status": r.status,
            "courseName": r.course_name,
            "remarks": r.remarks
        })
    db.close()
    return res

@app.get("/api/attendance/student/{identifier}/percentage")
def get_student_attendance_percentage(identifier: str):
    db = SessionLocal()
    st = None
    if identifier.isdigit():
        st = db.query(StudentLocal).filter(StudentLocal.id == int(identifier)).first()
    if not st:
        st = db.query(StudentLocal).filter(StudentLocal.roll_number == identifier).first()
    
    if not st:
        db.close()
        return {
            "student_id": identifier,
            "roll_number": identifier,
            "student_name": "Tidak Terdaftar di Attendance",
            "total_sessions": 0,
            "present_count": 0,
            "late_count": 0,
            "absent_count": 0,
            "attendance_percentage": 0.0
        }
    
    recs = db.query(AttendanceRecordDB).filter(AttendanceRecordDB.student_id == st.id).all()
    total = len(recs)
    present_count = sum(1 for r in recs if r.status.upper() == "PRESENT")
    late_count = sum(1 for r in recs if r.status.upper() == "LATE")
    absent_count = sum(1 for r in recs if r.status.upper() == "ABSENT")

    pct = round(((present_count + late_count * 0.5) / total) * 100, 2) if total > 0 else 100.0

    db.close()
    return {
        "student_id": st.id,
        "roll_number": st.roll_number,
        "student_name": st.name,
        "total_sessions": total,
        "present_count": present_count,
        "late_count": late_count,
        "absent_count": absent_count,
        "attendance_percentage": pct
    }

@app.get("/api/attendance/report/monthly")
def get_monthly_report():
    db = SessionLocal()
    recs = db.query(AttendanceRecordDB).all()
    total = len(recs)
    present = sum(1 for r in recs if r.status.upper() == "PRESENT")
    late = sum(1 for r in recs if r.status.upper() == "LATE")
    absent = sum(1 for r in recs if r.status.upper() == "ABSENT")
    pct = round(((present + late * 0.5) / total) * 100, 2) if total > 0 else 100.0
    db.close()

    return {
        "period": "Bulan Ini",
        "total_records": total,
        "total_present": present,
        "total_late": late,
        "total_absent": absent,
        "overall_attendance_percentage": pct
    }

@app.get("/api/attendance/report/low-attendance")
def get_low_attendance_report(threshold: float = Query(75.0)):
    db = SessionLocal()
    students = db.query(StudentLocal).all()
    res = []
    for st in students:
        recs = db.query(AttendanceRecordDB).filter(AttendanceRecordDB.student_id == st.id).all()
        total = len(recs)
        if total == 0: continue
        present = sum(1 for r in recs if r.status.upper() == "PRESENT")
        late = sum(1 for r in recs if r.status.upper() == "LATE")
        pct = round(((present + late * 0.5) / total) * 100, 2)

        if pct < threshold:
            res.append({
                "student_id": st.id,
                "roll_number": st.roll_number,
                "name": st.name,
                "department": st.department,
                "total_sessions": total,
                "percentage": pct
            })
    db.close()
    return res
