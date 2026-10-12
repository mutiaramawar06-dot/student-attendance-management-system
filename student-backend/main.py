import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "student_secret_key_cloud_computing_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./student.db")

# Convert postgres:// and postgresql:// to postgresql+psycopg2:// if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Admin") # Admin, Teacher, Viewer

class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String, unique=True, index=True, nullable=False) # NIM
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    department = Column(String, default="Informatika")
    year_of_study = Column(Integer, default=3)
    gpa = Column(Float, default=3.5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Schemas
class RegisterSchema(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "Admin"

class LoginSchema(BaseModel):
    username: str
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class StudentCreateSchema(BaseModel):
    roll_number: str
    name: str
    email: str
    department: Optional[str] = "Teknik Informatika"
    year_of_study: Optional[int] = 3
    gpa: Optional[float] = 3.5

class StudentResponseSchema(BaseModel):
    id: int
    roll_number: str
    name: str
    email: str
    department: str
    year_of_study: int
    gpa: float

    class Config:
        from_attributes = True

# Helper functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import hashlib

def verify_password(plain_password, hashed_password):
    if plain_password == hashed_password:
        return True
    try:
        import bcrypt
        if isinstance(hashed_password, str) and (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        pass

    sha_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    if sha_hash == hashed_password:
        return True

    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password):
    try:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception:
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header otentikasi tidak valid atau tidak ditemukan"
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Token tidak valid")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token kadaluarsa atau tidak valid")
    
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    return user

# Seed Initial Data
def seed_data():
    db = SessionLocal()
    try:
        # Check Admin
        admin = db.query(UserDB).filter(UserDB.username == "admin").first()
        if not admin:
            hashed_pw = get_password_hash("admin123")
            db.add(UserDB(username="admin", email="admin@univ.ac.id", hashed_password=hashed_pw, role="Admin"))
            db.add(UserDB(username="teacher", email="teacher@univ.ac.id", hashed_password=get_password_hash("teacher123"), role="Teacher"))
            db.add(UserDB(username="viewer", email="viewer@univ.ac.id", hashed_password=get_password_hash("viewer123"), role="Viewer"))
        else:
            if not verify_password("admin123", admin.hashed_password):
                admin.hashed_password = get_password_hash("admin123")
        
        # Check Students
        if db.query(StudentDB).count() == 0:
            sample_students = [
                StudentDB(roll_number="220101", name="Budi Santoso", email="budi@student.univ.ac.id", department="Teknik Informatika", year_of_study=3, gpa=3.85),
                StudentDB(roll_number="220102", name="Siti Rahma", email="siti@student.univ.ac.id", department="Sistem Informasi", year_of_study=3, gpa=3.75),
                StudentDB(roll_number="220103", name="Andi Wijaya", email="andi@student.univ.ac.id", department="Teknik Komputer", year_of_study=2, gpa=3.40),
                StudentDB(roll_number="220104", name="Dewi Lestari", email="dewi@student.univ.ac.id", department="Teknik Informatika", year_of_study=4, gpa=3.90),
                StudentDB(roll_number="220105", name="Eko Prasetyo", email="eko@student.univ.ac.id", department="Sistem Informasi", year_of_study=1, gpa=3.20),
            ]
            db.add_all(sample_students)
        db.commit()
    except Exception as e:
        print("Error seeding data:", e)
        db.rollback()
    finally:
        db.close()

seed_data()

# FastAPI App
app = FastAPI(
    title="Student Management System API",
    description="Backend Student Management System v2 - FastAPI & PostgreSQL/SQLite",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "service": "Student Management System v2", "version": "2.0.0"}

# AUTH ENDPOINTS
@app.post("/auth/register", status_code=201)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(UserDB).filter((UserDB.username == data.username) | (UserDB.email == data.email)).first():
        raise HTTPException(status_code=409, detail="Username atau email sudah terdaftar")
    
    user = UserDB(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        role=data.role or "Admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User berhasil mendaftar", "username": user.username}

@app.post("/auth/login", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Username atau password salah")
    
    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/auth/is_auth")
def is_auth(current_user: UserDB = Depends(get_current_user)):
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    }

# STUDENT ENDPOINTS
@app.get("/student/view_students", response_model=List[StudentResponseSchema])
def view_students(db: Session = Depends(get_db)):
    return db.query(StudentDB).all()

@app.get("/student/search_by_roll")
def search_by_roll(roll_number: Optional[str] = Query(None), roll: Optional[str] = Query(None), db: Session = Depends(get_db)):
    target_roll = roll_number or roll
    if not target_roll:
        raise HTTPException(status_code=400, detail="Parameter roll_number/roll diperlukan")
    
    student = db.query(StudentDB).filter(StudentDB.roll_number == target_roll).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Mahasiswa dengan NIM '{target_roll}' tidak ditemukan")
    return student

@app.get("/student/search_by_name")
def search_by_name(name: str = Query(...), db: Session = Depends(get_db)):
    students = db.query(StudentDB).filter(StudentDB.name.ilike(f"%{name}%")).all()
    return students

@app.get("/student/percent_student")
def percent_student(db: Session = Depends(get_db)):
    total = db.query(StudentDB).count()
    dept_counts = {}
    for st in db.query(StudentDB).all():
        dept_counts[st.department] = dept_counts.get(st.department, 0) + 1
    
    department_percentage = {
        dept: round((count / total) * 100, 2) if total > 0 else 0
        for dept, count in dept_counts.items()
    }
    
    return {
        "total_students": total,
        "department_distribution": department_percentage,
        "active_rate": 98.5
    }

@app.post("/admin/add_students", status_code=201)
def add_students(data: StudentCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(StudentDB).filter(StudentDB.roll_number == data.roll_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Mahasiswa dengan NIM {data.roll_number} sudah ada")
    
    student = StudentDB(
        roll_number=data.roll_number,
        name=data.name,
        email=data.email,
        department=data.department or "Teknik Informatika",
        year_of_study=data.year_of_study or 3,
        gpa=data.gpa or 3.50
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return {"message": "Mahasiswa berhasil ditambahkan", "student": student}

@app.delete("/admin/delete_students")
def delete_students(roll_number: Optional[str] = Query(None), id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if roll_number:
        student = db.query(StudentDB).filter(StudentDB.roll_number == roll_number).first()
    elif id:
        student = db.query(StudentDB).filter(StudentDB.id == id).first()
    else:
        raise HTTPException(status_code=400, detail="Sediakan parameter roll_number atau id")
    
    if not student:
        raise HTTPException(status_code=404, detail="Mahasiswa tidak ditemukan")
    
    db.delete(student)
    db.commit()
    return {"message": f"Mahasiswa {student.name} ({student.roll_number}) berhasil dihapus"}
