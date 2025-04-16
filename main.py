from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional, Union
from jose import JWTError, jwt
import crud, models, schemas, utils
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, engine

# Tải biến môi trường từ file .env
load_dotenv()

# Lấy các giá trị cấu hình từ biến môi trường
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Tạo bảng nếu chưa tồn tại
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Hàm để lấy user hiện tại từ token JWT

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = decode_token(token)
    if username is None:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    
    return user
# Kiểm tra phân quyền
def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can perform this action")
    return current_user

def get_team_lead_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "team_lead":
        raise HTTPException(status_code=403, detail="Only team lead can perform this action")
    return current_user

# Thêm các hàm này trước các route

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

@app.get("/")
def read_root():
    return {"message": "Welcome to the API!"}

@app.get("/users/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return {"users": [{"id": user.id, "username": user.username, "email": user.email, "role": user.role} for user in users]}

# Thay thế hàm login hiện tại
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_username(db, form_data.username)
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        if not crud.verify_password(form_data.password, user.password_hash): 
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        # Tạo JWT token thực tế
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role}, 
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        
@app.post("/register/")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Kiểm tra username đã tồn tại chưa
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Kiểm tra email đã tồn tại chưa
    if user.email and crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Kiểm tra phone_number đã tồn tại chưa
    if user.phone_number and crud.get_user_by_phone_number(db, user.phone_number):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Tạo user mới
    new_user = crud.create_user(
        db=db,
        username=user.username,
        email=user.email,
        password=user.password,
        role=user.role,
        phone_number=user.phone_number
    )
    return {"message": "User registered successfully", "user_id": new_user.id}

@app.post("/create-user/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_admin_user)):
    # Chỉ admin mới được tạo user mới
    
    # Kiểm tra username đã tồn tại chưa
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Kiểm tra email đã tồn tại chưa
    if user.email and crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Kiểm tra phone_number đã tồn tại chưa
    if user.phone_number and crud.get_user_by_phone_number(db, user.phone_number):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Tạo user mới
    new_user = crud.create_user(
        db=db,
        username=user.username,
        email=user.email,
        password=user.password,
        role=user.role,
        phone_number=user.phone_number
    )
    return {"message": "User created successfully", "user_id": new_user.id}

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

@app.put("/users/update-password")
def update_password(password_update: schemas.PasswordUpdate,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):

    # Kiểm tra mật khẩu cũ
    if not utils.verify_password(password_update.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    # Mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu
    hashed_new_password = utils.hash_password(password_update.new_password)  # Sử dụng hàm hash_password
    current_user.password_hash = hashed_new_password  # Cập nhật password_hash thay vì password
    db.commit()

    return {"message": "Password updated successfully"}

# Thêm endpoint này vào file main.py

@app.post("/device-groups/", response_model=schemas.DeviceGroupResponse)
def create_device_group(
    device_group: schemas.DeviceGroupCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra xem group name đã tồn tại chưa
    if crud.get_device_group_by_name(db, device_group.group_name):
        raise HTTPException(status_code=400, detail="Device group with this name already exists")
    
    # Tạo device group mới
    db_device_group = crud.create_device_group(
        db, 
        group_name=device_group.group_name, 
        description=device_group.description
    )
    
    return {
        "id": db_device_group.id,
        "group_name": db_device_group.group_name,
        "description": db_device_group.description
    }

@app.get("/device-groups/", response_model=List[schemas.DeviceGroupResponse])
def get_device_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    device_groups = db.query(models.DeviceGroup).all()
    return [
        {
            "id": group.id, 
            "group_name": group.group_name, 
            "description": group.description
        } 
        for group in device_groups
    ]

@app.get("/device-groups/{device_group_id}", response_model=schemas.DeviceGroupResponse)
def get_device_group(
    device_group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    device_group = crud.get_device_group(db, device_group_id)
    if not device_group:
        raise HTTPException(status_code=404, detail="Device group not found")
    
    return {
        "id": device_group.id,
        "group_name": device_group.group_name,
        "description": device_group.description
    }

# API cho CommandList
@app.post("/command-lists/", response_model=schemas.CommandListResponse, status_code=status.HTTP_201_CREATED)
def create_command_list(
    command_list: schemas.CommandListCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
@app.post("/profiles/", response_model=schemas.ProfileResponse)
def create_profile(
    profile: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra xem profile name đã tồn tại chưa
    if crud.get_profile_by_name(db, profile.name):
        raise HTTPException(status_code=400, detail="Profile with this name already exists")
    
    # Kiểm tra command list tồn tại
    command_list = crud.get_command_list(db, profile.command_list_id)
    if not command_list:
        raise HTTPException(status_code=404, detail="Command list not found")
    
    # Kiểm tra device group tồn tại
    device_group = crud.get_device_group(db, profile.device_group_id)
    if not device_group:
        raise HTTPException(status_code=404, detail="Device group not found")
    
    # Tạo profile mới
    db_profile = crud.create_profile(
        db,
        profile_name=profile.name,  # Lưu ý trong DB là profile_name
        team_lead_id=current_user.id,
        command_list_id=profile.command_list_id,
        device_group_id=profile.device_group_id
    )
    
    # Tạo response
    return {
        "id": db_profile.id,
        "name": db_profile.name,  # Lưu ý trường trong DB là profile_name
        "command_list_id": db_profile.command_list_id,
        "device_group_id": db_profile.device_group_id
    }

# API để gán profile cho operator
@app.post("/assign-profile/")
def assign_profile(
    profile_id: int,
    operator_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra profile tồn tại
    profile = crud.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Kiểm tra operator tồn tại
    operator = crud.get_user(db, operator_id)
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    # Chỉ gán cho user có vai trò operator
    if operator.role != "operator":
        raise HTTPException(status_code=400, detail="Can only assign profiles to users with operator role")
    
    # Gán profile
    user_profile = crud.assign_profile_to_operator(db, profile_id, operator_id)
    
    return {"message": "Profile assigned successfully"}

@app.post("/devices/", response_model=schemas.DeviceResponse)
def create_device(
    device: schemas.DeviceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    try:
        # Kiểm tra thiết bị đã tồn tại chưa bằng IP address
        if crud.get_device_by_ip(db, device.ip_address):
            raise HTTPException(status_code=400, detail="Device with this IP address already exists")
        
        # Kiểm tra device group tồn tại
        device_group = crud.get_device_group(db, device.device_group_id)
        if not device_group:
            raise HTTPException(status_code=404, detail="Device group not found")
        
        # Kiểm tra device username đã tồn tại chưa
        if crud.get_device_by_username(db, device.username):
            raise HTTPException(status_code=400, detail="Device with this username already exists")
        
        # Tạo thiết bị mới
        db_device = crud.create_device(
            db=db,
            ip_address=device.ip_address,
            port=device.port,
            connection_type=device.connection_type,
            username=device.username,
            password=device.password,
            device_type=device.device_type,
            location=device.location,
            controlled_feature=device.controlled_feature,
            private_key=device.private_key,
            owner_id=current_user.id,
            device_group_id=device.device_group_id
        )
        
        return {
            "id": db_device.id,
            "ip_address": db_device.ip_address,
            "port": db_device.port,
            "connection_type": db_device.connection_type,
            "username": db_device.username,
            "device_type": db_device.device_type,
            "location": db_device.location,
            "controlled_feature": db_device.controlled_feature,
            "device_group_id": db_device.device_group_id,
            "owner_id": db_device.owner_id,
            "created_at": db_device.created_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Thêm vào main.py

# 1. ADMIN APIS - USER MANAGEMENT

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    # Không cho phép admin tự thay đổi role của chính mình
    if user_id == current_user.id and user_update.role is not None:
        raise HTTPException(status_code=400, detail="Admin cannot change their own role")
    
    # Cập nhật user
    user_data = user_update.dict(exclude_unset=True)
    updated_user = crud.update_user(db, user_id, user_data)
    
    if updated_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    # Không cho phép admin xóa chính mình
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Admin cannot delete their own account")
    
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# 2. TEAM LEAD APIS - DEVICE MANAGEMENT

@app.put("/devices/{device_id}", response_model=schemas.DeviceResponse)
def update_device(
    device_id: int,
    device_update: schemas.DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra device tồn tại
    device = crud.get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Nếu cập nhật username, kiểm tra xem username mới đã tồn tại chưa
    if device_update.username and device_update.username != device.username:
        existing_device = crud.get_device_by_username(db, device_update.username)
        if existing_device:
            raise HTTPException(status_code=400, detail="Device with this username already exists")
    
    # Nếu cập nhật IP, kiểm tra xem IP mới đã tồn tại chưa
    if device_update.ip_address and device_update.ip_address != device.ip_address:
        existing_device = crud.get_device_by_ip(db, device_update.ip_address)
        if existing_device:
            raise HTTPException(status_code=400, detail="Device with this IP address already exists")
    
    # Nếu cập nhật device_group_id, kiểm tra xem device group mới có tồn tại không
    if device_update.device_group_id:
        device_group = crud.get_device_group(db, device_update.device_group_id)
        if not device_group:
            raise HTTPException(status_code=404, detail="Device group not found")
    
    # Cập nhật device
    device_data = device_update.dict(exclude_unset=True)
    updated_device = crud.update_device(db, device_id, device_data)
    
    return updated_device

@app.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    success = crud.delete_device(db, device_id)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device deleted successfully"}

# 3. TEAM LEAD APIS - DEVICE GROUP MANAGEMENT

@app.put("/device-groups/{device_group_id}", response_model=schemas.DeviceGroupResponse)
def update_device_group(
    device_group_id: int,
    device_group_update: schemas.DeviceGroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra device group tồn tại
    device_group = crud.get_device_group(db, device_group_id)
    if not device_group:
        raise HTTPException(status_code=404, detail="Device group not found")
    
    # Nếu cập nhật tên, kiểm tra xem tên mới đã tồn tại chưa
    if device_group_update.group_name and device_group_update.group_name != device_group.group_name:
        existing_group = crud.get_device_group_by_name(db, device_group_update.group_name)
        if existing_group:
            raise HTTPException(status_code=400, detail="Device group with this name already exists")
    
    # Cập nhật device group
    device_group_data = device_group_update.dict(exclude_unset=True)
    updated_device_group = crud.update_device_group(db, device_group_id, device_group_data)
    
    return {
        "id": updated_device_group.id,
        "group_name": updated_device_group.group_name,
        "description": updated_device_group.description
    }

@app.delete("/device-groups/{device_group_id}")
def delete_device_group(
    device_group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    success = crud.delete_device_group(db, device_group_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete device group. It may have devices associated with it.")
    
    return {"message": "Device group deleted successfully"}

# 4. TEAM LEAD APIS - COMMAND LIST MANAGEMENT

@app.put("/command-lists/{command_list_id}", response_model=schemas.CommandListResponse)
def update_command_list(
    command_list_id: int,
    command_list_update: schemas.CommandListUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra command list tồn tại
    command_list = crud.get_command_list(db, command_list_id)
    if not command_list:
        raise HTTPException(status_code=404, detail="Command list not found")
    
    # Nếu cập nhật tên, kiểm tra xem tên mới đã tồn tại chưa
    if command_list_update.name and command_list_update.name != command_list.name:
        existing_list = crud.get_command_list_by_name(db, command_list_update.name)
        if existing_list:
            raise HTTPException(status_code=400, detail="Command list with this name already exists")
    
    # Cập nhật command list
    command_list_data = command_list_update.dict(exclude_unset=True)
    updated_command_list = crud.update_command_list(db, command_list_id, command_list_data)
    
    return {
        "id": updated_command_list.id,
        "name": updated_command_list.name,
        "commands": json.loads(updated_command_list.commands)
    }

@app.delete("/command-lists/{command_list_id}")
def delete_command_list(
    command_list_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    success = crud.delete_command_list(db, command_list_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete command list. It may be used in profiles.")
    
    return {"message": "Command list deleted successfully"}

# 5. TEAM LEAD APIS - PROFILE MANAGEMENT

@app.put("/profiles/{profile_id}", response_model=schemas.ProfileResponse)
def update_profile(
    profile_id: int,
    profile_update: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Kiểm tra profile tồn tại
    profile = crud.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Nếu cập nhật tên, kiểm tra xem tên mới đã tồn tại chưa
    if profile_update.name and profile_update.name != profile.name:
        existing_profile = crud.get_profile_by_name(db, profile_update.name)
        if existing_profile:
            raise HTTPException(status_code=400, detail="Profile with this name already exists")
    
    # Nếu cập nhật command_list_id, kiểm tra xem command list mới có tồn tại không
    if profile_update.command_list_id:
        command_list = crud.get_command_list(db, profile_update.command_list_id)
        if not command_list:
            raise HTTPException(status_code=404, detail="Command list not found")
    
    # Nếu cập nhật device_group_id, kiểm tra xem device group mới có tồn tại không
    if profile_update.device_group_id:
        device_group = crud.get_device_group(db, profile_update.device_group_id)
        if not device_group:
            raise HTTPException(status_code=404, detail="Device group not found")
    
    # Cập nhật profile
    profile_data = profile_update.dict(exclude_unset=True)
    updated_profile = crud.update_profile(db, profile_id, profile_data)
    
    return {
        "id": updated_profile.id,
        "name": updated_profile.name,
        "command_list_id": updated_profile.command_list_id,
        "device_group_id": updated_profile.device_group_id
    }

@app.delete("/profiles/{profile_id}")
def delete_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    success = crud.delete_profile(db, profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {"message": "Profile deleted successfully"}


@app.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Chỉ cần gửi phản hồi xác nhận logout thành công
    return {"message": "Logged out successfully"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React chạy tại cổng 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)