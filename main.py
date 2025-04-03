from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import crud, schemas, utils
from database import get_db
from models import User


app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI!"}

@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    """Endpoint để lấy danh sách người dùng từ cơ sở dữ liệu."""
    users = db.query(User).all()
    return {"users": [{"username": user.username, "email": user.email, "role": user.role} for user in users]}

@app.post("/create-user/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if role is valid
    if user.role not in ["manager", "engineer"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'manager' or 'engineer'.")

    # Check if username already exists in the database
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists.")

    # Hash the user's password
    hashed_password = utils.hash_password(user.password)

    # Create a new user in the database
    new_user = crud.create_user(
        db=db,
        username=user.username,
        phone_number=user.phone_number,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    return {"message": "User created successfully", "user": {"username": new_user.username, "role": new_user.role}}

@app.post("/register/")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email_or_phone(db, user.email) or crud.get_user_by_email_or_phone(db, user.phone_number):
        raise HTTPException(status_code=400, detail="Email hoặc số điện thoại đã tồn tại")

    new_user = crud.create_user(db, user.username, user.phone_number, user.email, user.password)
    return {"message": "Đăng ký thành công!", "user_id": new_user.id}

@app.post("/forgot-password/")
def forgot_password(request: schemas.ResetPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = crud.get_user_by_email_or_phone(db, request.email_or_phone)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    background_tasks.add_task(utils.send_email_otp, user.email)
    return {"message": "OTP đã được gửi đến email!"}

@app.post("/reset-password/")
def reset_password(request: schemas.ResetPasswordConfirm, db: Session = Depends(get_db)):
    user = crud.get_user_by_email_or_phone(db, request.email_or_phone)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    if not utils.verify_otp(request.email_or_phone, request.otp):
        raise HTTPException(status_code=400, detail="OTP không hợp lệ")

    updated_user = crud.update_password(db, user, request.new_password)
    return {"message": "Mật khẩu đã được cập nhật thành công!"}
