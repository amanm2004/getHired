from pydantic import BaseModel, EmailStr


class UserSignUp(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class User(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str
    is_active: bool

class Job(BaseModel):
    title: str
    company: str
    location: str
    link: str | None = None
    description: str | None = None
    contact: str | None = None