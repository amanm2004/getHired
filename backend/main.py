import hashlib
import os
import sqlite3
import tempfile
import uuid
from datetime import datetime, timedelta
from typing import Optional

import google.generativeai as genai
import jwt
import requests
from fastapi import (Depends, FastAPI, File, HTTPException, Query, UploadFile,
                     status)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from model import Job, Token, User, UserSignIn, UserSignUp
from passlib.context import CryptContext
from PIL import Image
from pydantic import BaseModel, EmailStr

app = FastAPI(title="GetHired API", description="Job Search and Resume Analysis Platform")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
     allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "71ecdc791ab0b6a894ca7b82ea1f0bdfb848f8bbc627461038fe1be084384ef2")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDx6IZKdQbis35f2JrGQQFBfGCkgr2EGcE")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

genai.configure(api_key=GEMINI_API_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto",bcrypt__rounds=12)
security = HTTPBearer()

# ---------- Database Setup ----------

# def init_db():
#     conn = sqlite3.connect('users.db')
#     cursor = conn.cursor()
    
#     # Users table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS users (
#             id TEXT PRIMARY KEY,
#             email TEXT UNIQUE NOT NULL,
#             full_name TEXT NOT NULL,
#             hashed_password TEXT NOT NULL,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             is_active BOOLEAN DEFAULT 1
#         )
#     ''')
    
#     # User sessions table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS user_sessions (
#             id TEXT PRIMARY KEY,
#             user_id TEXT NOT NULL,
#             token_jti TEXT NOT NULL,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             expires_at TIMESTAMP NOT NULL,
#             is_active BOOLEAN DEFAULT 1,
#             FOREIGN KEY (user_id) REFERENCES users (id)
#         )
#     ''')
    
#     conn.commit()
#     conn.close()

# init_db()

# ---------- Authentication Models ----------

# class UserSignUp(BaseModel):
#     email: EmailStr
#     full_name: str
#     password: str

# class UserSignIn(BaseModel):
#     email: EmailStr
#     password: str

# class Token(BaseModel):
#     access_token: str
#     token_type: str
#     user: dict

# class User(BaseModel):
#     id: str
#     email: str
#     full_name: str
#     created_at: str
#     is_active: bool

# ---------- Password Utilities ----------

def get_password_hash(password: str) -> str:
    # Pre-hash with SHA256
    password_sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
    # Truncate to 72 bytes for bcrypt
    truncated = password_sha[:72]
    return pwd_context.hash(truncated)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_sha = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    truncated = password_sha[:72]
    return pwd_context.verify(truncated, hashed_password)


# ---------- JWT Utilities ----------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "jti": str(uuid.uuid4())})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, to_encode["jti"]

# ---------- Database Helpers ----------

def get_user_by_email(email: str):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "id": user[0],
            "email": user[1],
            "full_name": user[2],
            "hashed_password": user[3],
            "created_at": user[4],
            "is_active": bool(user[5])
        }
    return None

def get_user_by_id(user_id: str):
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return {
            "id": user[0],
            "email": user[1],
            "full_name": user[2],
            "hashed_password": user[3],
            "created_at": user[4],
            "is_active": bool(user[5])
        }
    return None

# ---------- Authentication Dependencies ----------

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    return user

# ---------- Auth Endpoints ----------

@app.post("/api/auth/signup", response_model=Token)
async def sign_up(user_data: UserSignUp):
    if get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (id, email, full_name, hashed_password) VALUES (?, ?, ?, ?)",
            (user_id, user_data.email, user_data.full_name, hashed_password)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()
    
    access_token, jti = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    user = get_user_by_id(user_id)
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "created_at": user["created_at"],
        "is_active": user["is_active"]
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.post("/api/auth/signin", response_model=Token)
async def sign_in(user_credentials: UserSignIn):
    user = get_user_by_email(user_credentials.email)
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is deactivated")
    
    access_token, jti = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    user_response = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "created_at": user["created_at"],
        "is_active": user["is_active"]
    }
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "created_at": current_user["created_at"],
        "is_active": current_user["is_active"]
    }

@app.post("/api/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

# ---------- Job Search ----------

# class Job(BaseModel):
#     title: str
#     company: str
#     location: str
#     link: str | None = None
#     description: str | None = None
#     contact: str | None = None

@app.get("/api/search", response_model=list[Job])
def search_jobs(
    query: str = Query(..., description="Job title or keywords"),
    location: str = Query("India", description="Job location"),
    current_user: dict = Depends(get_current_user)
):
    url = "https://serpapi.com/search"
    params = {"engine": "google_jobs", "q": query, "location": location, "api_key": SERPAPI_KEY}
    try:
        r = requests.get(url, params=params, timeout=10)
        data = r.json()
    except Exception:
        return []

    jobs = []
    for item in data.get("jobs_results", []):
        jobs.append({
            "title": item.get("title", ""),
            "company": item.get("company_name", ""),
            "location": item.get("location", ""),
            "link": item.get("related_links", [{}])[0].get("link", None),
            "description": item.get("description", ""),
            "contact": item.get("job_posting_metadata", {}).get("source", None)
        })
    return jobs

# ---------- Resume Analysis ----------

@app.post("/api/analyze_resume")
async def analyze_resume(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1].lower()
    text = ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            import pdfplumber
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
            if not text.strip():
                import pytesseract
                from pdf2image import convert_from_path
                pages = convert_from_path(tmp_path)
                for page_img in pages:
                    text += pytesseract.image_to_string(page_img)
        elif suffix == ".docx":
            from docx import Document
            doc = Document(tmp_path)
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        elif suffix == ".doc":
            import mammoth
            with open(tmp_path, "rb") as f:
                text = mammoth.extract_raw_text(f).value
        elif suffix == ".txt":
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        elif suffix in [".jpg", ".jpeg", ".png"]:
            import pytesseract
            from PIL import Image
            img = Image.open(tmp_path)
            text = pytesseract.image_to_string(img)
        else:
            return {"error": "Unsupported file format"}
    finally:
        os.remove(tmp_path)

    if not text.strip():
        return {"error": "Could not extract text from file"}

    prompt = f"""
You are an expert resume analyzer. Review this resume and provide:
1. Suggestions for improvement (format, clarity, content)
2. Missing skills or sections
3. Overall score out of 10 for job applications
4. Make it short and give reviews in points maximum 10 points

Resume:
{text}
    """
    try:
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        feedback = response.text
    except Exception as e:
        feedback = f"Error analyzing resume with Gemini: {str(e)}"

    return {"feedback": feedback}


# ---------- Health Check ----------

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "GetHired API is running"}

# ---------- Dashboard ----------

@app.get("/api/dashboard/stats")
async def get_user_stats(current_user: dict = Depends(get_current_user)):
    return {
        "user_name": current_user["full_name"],
        "total_searches": 0,
        "resumes_analyzed": 0,
        "member_since": current_user["created_at"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
