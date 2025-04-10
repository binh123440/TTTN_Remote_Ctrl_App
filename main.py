import json
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
import crud, schemas, utils
from database import get_db
from models import User, CommandList, Profile

app = FastAPI()

# Hàm để lấy user hiện tại (di chuyển lên đầu file)
def get_current_user(db: Session = Depends(get_db)):
    # Đây chỉ là mẫu, trong thực tế bạn sẽ lấy user từ token JWT hoặc session
    return db.query(User).filter(User.role == "team_lead").first()

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
    if user.role not in ["manager", "engineer","team_lead"]:
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

# API cho CommandList
@app.post("/command-lists/", response_model=schemas.CommandListResponse, status_code=status.HTTP_201_CREATED)
def create_command_list(
    command_list: schemas.CommandListCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra quyền hạn team lead
    if current_user.role != "team_lead":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team lead can create command lists"
        )
    
    # Kiểm tra xem command list đã tồn tại chưa
    existing = crud.get_command_list_by_name(db, command_list.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command list name already exists"
        )
    
    # Tạo command list mới
    result = crud.create_command_list(db, command_list.name, command_list.commands)
    
    # Chuyển đổi chuỗi JSON thành danh sách Python
    return {
        "id": result.id,
        "name": result.name,
        "commands": json.loads(result.commands)
    }

# API cho Profile
@app.post("/profiles/", response_model=schemas.ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile: schemas.ProfileCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra quyền hạn team lead
    if current_user.role != "team_lead":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team lead can create profiles"
        )
    
    # Kiểm tra xem profile đã tồn tại chưa
    existing = crud.get_profile_by_name(db, profile.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile name already exists"
        )
    
    # Kiểm tra command list có tồn tại không
    command_list = crud.get_command_list(db, profile.command_list_id)
    if not command_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command list not found"
        )
    
    # Tạo profile mới
    result = crud.create_profile(db, profile.name, profile.command_list_id, profile.device_group_id)
    
    return {
        "id": result.id,
        "name": result.name,
        "command_list_id": result.command_list_id,
        "device_group_id": result.device_group_id
    }
