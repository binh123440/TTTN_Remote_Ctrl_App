from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    phone_number: str
    email: EmailStr
    password: str
    role: str  # Thêm trường role

class ResetPasswordRequest(BaseModel):
    email_or_phone: str

class ResetPasswordConfirm(BaseModel):
    email_or_phone: str
    otp: str
    new_password: str
