from datetime import datetime, timedelta
import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Union
from jose import JWTError, jwt
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from network.scanner import get_local_ip, scan_network, get_hotspot_devices
from network.ssh_client import execute_ssh_command
from api import crud, models, schemas, utils
from api.database import get_db, engine

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers for better error reporting
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Format the exception details
    error_detail = str(exc)
    
    # Return the exception details in the response
    return JSONResponse(
        status_code=500,
        content={"detail": error_detail}
    )

# If using SQLAlchemy, also add a specific handler
@app.exception_handler(IntegrityError)
async def sqlalchemy_exception_handler(request, exc):
    # Extract and format the SQLAlchemy error
    error_detail = str(exc)
    
    # Return the formatted error
    return JSONResponse(
        status_code=422,
        content={"detail": error_detail}
    )
    
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
    return {"users": [
        {
            "id": user.id, 
            "username": user.username, 
            "email": user.email, 
            "phone_number": user.phone_number,
            "password": "********" if user.password else "",  # Masked password - never expose real hashes
            "role": user.role
        } 
        for user in users
    ]}

# Thay thế hàm login hiện tại
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = crud.get_user_by_username(db, form_data.username)
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect username or password")
        
        if not crud.verify_password(form_data.password, user.password):
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
@app.post("/admin/reset-admin-password")
def reset_admin_password(db: Session = Depends(get_db)):
    admin = db.query(models.User).filter(models.User.username == "admin1").first()
    
    if not admin:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản admin1")
    
    admin.password = utils.hash_password("123456")  # Hash lại mật khẩu mặc định
    db.commit()
    
    return {"message": "Đã reset mật khẩu của admin1 về mặc định"}       
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
    if not utils.verify_password(password_update.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    # Mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu
    hashed_new_password = utils.hash_password(password_update.new_password)  # Sử dụng hàm hash_password
    current_user.password = hashed_new_password  
    db.commit()

    return {"message": "Password updated successfully"}



# API cho CommandList
@app.post("/command-lists/", response_model=schemas.CommandListResponse, status_code=status.HTTP_201_CREATED)
def create_command_list(
    command_list: schemas.CommandListCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
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
        "commands": result.commands if isinstance(result.commands, list) else 
                  json.loads(result.commands) if isinstance(result.commands, (str, bytes, bytearray)) else []
    }

@app.get("/command-lists/", response_model=List[schemas.CommandListResponse])
def get_command_lists(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)  # Changed from get_team_lead_user
):
    # Different behavior based on user role
    if current_user.role == "team_lead" or current_user.role == "admin":
        # Team leads and admins see all command lists
        command_lists = db.query(models.CommandList).all()
    elif current_user.role == "operator":
        # Operators only see command lists from their assigned profiles
        
        # Step 1: Get all profiles assigned to the operator
        user_profiles = db.query(models.UserProfile).filter(
            models.UserProfile.operator_id == current_user.id
        ).all()
        
        # Step 2: Extract the profile IDs
        profile_ids = [up.profile_id for up in user_profiles]
        
        # Step 3: Get the profiles with their command lists
        profiles = db.query(models.Profile).filter(
            models.Profile.id.in_(profile_ids)
        ).all()
        
        # Step 4: Extract command list IDs
        command_list_ids = [profile.command_list_id for profile in profiles if profile.command_list_id]
        
        # Step 5: Get only the command lists the operator has access to
        command_lists = db.query(models.CommandList).filter(
            models.CommandList.id.in_(command_list_ids)
        ).all()
    else:
        # Supervisors or other roles not allowed
        raise HTTPException(status_code=403, detail="You don't have permission to view command lists")
    
    # Format and return the results
    return [
        {
            "id": command_list.id,
            "name": command_list.name,
            "commands": command_list.commands if isinstance(command_list.commands, list) else 
                      json.loads(command_list.commands) if isinstance(command_list.commands, (str, bytes, bytearray)) else []
        } 
        for command_list in command_lists
    ]
@app.get("/command-lists/{command_list_id}", response_model=schemas.CommandListResponse)
def get_command_list(
    command_list_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    command_list = crud.get_command_list(db, command_list_id)
    if not command_list:
        raise HTTPException(status_code=404, detail="Command list not found")
    
    return {
        "id": command_list.id,
        "name": command_list.name,
        "commands": command_list.commands if isinstance(command_list.commands, list) else 
                  json.loads(command_list.commands) if isinstance(command_list.commands, (str, bytes, bytearray)) else []
    }
# API cho Profile
@app.get("/profiles/", response_model=List[schemas.ProfileResponseList])
def get_profiles(
    db: Session = Depends(get_db),
    current_user=Depends(get_team_lead_user)
):
    profiles = db.query(models.Profile).\
        options(joinedload(models.Profile.command_list), joinedload(models.Profile.device_group)).\
        all()

    # Trả về các profiles cùng với tên của command và device group
    return [
        schemas.ProfileResponseList(
            id=profile.id,
            name=profile.name,
            command_list_id=profile.command_list_id,
            command_name=profile.command_list.name if profile.command_list else None,
            device_group_id=profile.device_group_id,
            device_group_name=profile.device_group.group_name if profile.device_group else None
        )
        for profile in profiles
    ]

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
    assign_profile: schemas.AssignProfileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Handle assignment of multiple profiles to one operator
    if hasattr(assign_profile, 'profile_ids') and assign_profile.profile_ids:
        operator_id = assign_profile.operator_id
        
        # Check if operator exists and has the correct role
        operator = crud.get_user(db, operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")
        
        if operator.role != "operator":
            raise HTTPException(status_code=400, detail="Can only assign profiles to users with operator role")
        
        # Assign each profile to the operator
        assigned_profiles = []
        for profile_id in assign_profile.profile_ids:
            profile = crud.get_profile(db, profile_id)
            if not profile:
                raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
                
            crud.assign_profile_to_operator(db, profile_id, operator_id)
            assigned_profiles.append(profile.name)
            
        return {
            "message": "Profiles assigned successfully",
            "assigned_profile": {
                "operator_name": operator.username,
                "profile_count": len(assign_profile.profile_ids),
                "profiles": assigned_profiles
            }
        }
    
    # Handle assignment of multiple operators to one profile
    elif hasattr(assign_profile, 'operator_ids') and assign_profile.operator_ids:
        profile_id = assign_profile.profile_id
        
        # Check if profile exists
        profile = crud.get_profile(db, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Assign the profile to each operator
        assigned_operators = []
        for operator_id in assign_profile.operator_ids:
            operator = crud.get_user(db, operator_id)
            if not operator:
                raise HTTPException(status_code=404, detail=f"Operator with ID {operator_id} not found")
                
            if operator.role != "operator":
                raise HTTPException(status_code=400, detail=f"User {operator.username} is not an operator")
                
            crud.assign_profile_to_operator(db, profile_id, operator_id)
            assigned_operators.append(operator.username)
            
        return {
            "message": "Profile assigned to multiple operators successfully",
            "assigned_profile": {
                "profile_name": profile.name,
                "operator_count": len(assign_profile.operator_ids),
                "operators": assigned_operators
            }
        }
    
    # Handle the original single assignment case for backward compatibility
    else:
        profile_id = assign_profile.profile_id
        operator_id = assign_profile.operator_id

        # Check if profile exists
        profile = crud.get_profile(db, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Check if operator exists
        operator = crud.get_user(db, operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")

        # Only assign to users with operator role
        if operator.role != "operator":
            raise HTTPException(
                status_code=400,
                detail="Can only assign profiles to users with operator role"
            )

        # Assign profile
        crud.assign_profile_to_operator(db, profile_id, operator_id)

        return {
            "message": "Profile assigned successfully",
            "assigned_profile": {
                "profile_name": profile.name,
                "operator_name": operator.username
            }
        }

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
# Device Groups API
@app.get("/device-groups/", response_model=List[schemas.DeviceGroupResponse])
def get_device_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
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



@app.get("/device-groups/{device_group_id}", response_model=schemas.DeviceGroupResponse)
def get_device_group(
    device_group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    device_group = crud.get_device_group(db, device_group_id)
    if not device_group:
        raise HTTPException(status_code=404, detail="Device group not found")
    
    return {
        "id": device_group.id,
        "group_name": device_group.group_name,
        "description": device_group.description
    }

@app.get("/device-groups/{device_group_id}/commands")
def get_commands_for_device_group(
    device_group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get profiles that the operator has access to and match the device group
    if current_user.role == "operator":
        # Get profiles assigned to this operator
        user_profiles = db.query(models.UserProfile).filter(
            models.UserProfile.operator_id == current_user.id
        ).all()
        
        # Get profile IDs
        profile_ids = [up.profile_id for up in user_profiles]
        
        # Get profiles matching both the operator's assignments AND the requested device group
        profiles = db.query(models.Profile).filter(
            models.Profile.id.in_(profile_ids),
            models.Profile.device_group_id == device_group_id
        ).all()
    else:
        # For team leads and admins, just get profiles for the device group
        profiles = db.query(models.Profile).filter(
            models.Profile.device_group_id == device_group_id
        ).all()
    
    # Get command list IDs from these profiles
    command_list_ids = [profile.command_list_id for profile in profiles if profile.command_list_id]
    
    # Get the command lists
    command_lists = db.query(models.CommandList).filter(
        models.CommandList.id.in_(command_list_ids)
    ).all()
    
    # Collect all commands
    all_commands = []
    for cmd_list in command_lists:
        commands = cmd_list.commands
        if isinstance(commands, str):
            try:
                commands = json.loads(commands)
            except:
                commands = []
        if isinstance(commands, list):
            all_commands.extend(commands)
    
    # Remove duplicates
    unique_commands = list(set(all_commands))
    
    return {"commands": unique_commands}
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
        "commands": updated_command_list.commands if isinstance(updated_command_list.commands, list) else 
                  json.loads(updated_command_list.commands) if isinstance(updated_command_list.commands, (str, bytes, bytearray)) else []
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

@app.get("/user-profiles/operator/{operator_id}")
def get_operator_profiles(
    operator_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Get user profiles for this operator
    user_profiles = db.query(models.UserProfile)\
        .filter(models.UserProfile.operator_id == operator_id)\
        .all()
    
    result = []
    for up in user_profiles:
        profile = crud.get_profile(db, up.profile_id)
        if profile:
            result.append({
                "user_profile_id": up.id,
                "operator_id": up.operator_id,
                "profile_id": up.profile_id,
                "profile_name": profile.name
            })
    
    return result

@app.delete("/unassign-profile/")
def unassign_profile(
    unassign_request: schemas.UnassignProfileRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_team_lead_user)
):
    # Handle unassignment of multiple profiles from one operator
    if hasattr(unassign_request, 'profile_ids') and unassign_request.profile_ids:
        operator_id = unassign_request.operator_id
        
        # Check if operator exists
        operator = crud.get_user(db, operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")
        
        # Unassign each profile from the operator
        unassigned_profiles = []
        for profile_id in unassign_request.profile_ids:
            profile = crud.get_profile(db, profile_id)
            if not profile:
                raise HTTPException(status_code=404, detail=f"Profile with ID {profile_id} not found")
                
            success = crud.unassign_profile_from_operator(db, profile_id, operator_id)
            if success:
                unassigned_profiles.append(profile.name)
            
        return {
            "message": "Profiles unassigned successfully",
            "unassigned_profiles": {
                "operator_name": operator.username,
                "profile_count": len(unassigned_profiles),
                "profiles": unassigned_profiles
            }
        }
    
    # Handle single unassignment case
    else:
        profile_id = unassign_request.profile_id
        operator_id = unassign_request.operator_id

        # Check if profile exists
        profile = crud.get_profile(db, profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        # Check if operator exists
        operator = crud.get_user(db, operator_id)
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found")

        # Unassign profile
        success = crud.unassign_profile_from_operator(db, profile_id, operator_id)
        if not success:
            raise HTTPException(status_code=404, detail="Assignment not found")

        return {
            "message": "Profile unassigned successfully",
            "unassigned_profile": {
                "profile_name": profile.name,
                "operator_name": operator.username
            }
        }

@app.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Chỉ cần gửi phản hồi xác nhận logout thành công
    return {"message": "Logged out successfully"}

# Get Device and SendSSHCommand
@app.get("/scan")
def scan():
    local_ip = get_local_ip()
    base_ip = '.'.join(local_ip.split('.')[:3])
    devices = scan_network(base_ip)
    return devices

@app.get("/hotspot")
def hotspot_devices():
    devices = get_hotspot_devices()
    return devices

@app.get("/docker-linux")
def scan_docker_linux(
    current_user: models.User = Depends(get_current_user)
):
    """
    Scan for Docker Linux virtual machines specifically
    
    Returns:
        List of discovered Docker Linux containers with SSH access details
    """
    from network.scanner import scan_docker_containers
    try:
        devices = scan_docker_containers()
        return devices
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scan Docker Linux containers: {str(e)}"
        )

@app.post("/ssh")
def ssh_command(
    data: schemas.SSHRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Kiểm tra role
    if current_user.role != "operator":
        raise HTTPException(status_code=403, detail="Only operator can execute SSH commands")

    # 2. Kiểm tra quyền truy cập device và command
    allowed, reason = crud.operator_can_access_device_and_command(db, current_user.id, data.ip, data.command)
    if not allowed:
        raise HTTPException(status_code=403, detail=reason)

    # 3. Tạo session
    session = crud.create_session(db, current_user.id, crud.get_device_by_ip(db, data.ip).id)

    # 4. Thực thi SSH như cũ
    result = execute_ssh_command(
        ip=data.ip,
        username=data.username,
        password=data.password,
        command=data.command,
        port=data.port
    )
    # 5. (Có thể log lại kết quả nếu muốn)
    crud.update_session_detail(db, session.id, json.dumps(result))
    crud.create_log(
        db,
        user_id=current_user.id,
        device_id=crud.get_device_by_ip(db, data.ip).id,
        command=data.command,
        result=json.dumps(result)
    )

    return result
@app.get("/history")
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisor can view session history")
        
    # Get all active sessions with joined relationships
    sessions = db.query(models.Session)\
        .filter_by(status="active")\
        .options(
            joinedload(models.Session.operator),
            joinedload(models.Session.device)
        ).all()
    
    # Format the response with all fields
    result = []
    for session in sessions:
        session_data = {
            "id": session.id,
            "operator_id": session.operator_id,
            "device_id": session.device_id,
            "status": session.status,
            "detail": session.detail,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            # Include additional information from relationships
            "operator_username": session.operator.username if session.operator else None,
            "device_ip": session.device.ip_address if session.device else None
        }
        result.append(session_data)
        
    return result
@app.post("/history")
def kill_session(
    req:schemas.KillSessionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisor can kill sessions")
    # Tìm session active của operator
    sessions = db.query(models.Session).filter_by(operator_id=req.operator_id, status="active").all()
    if not sessions:
        raise HTTPException(status_code=404, detail="No active session found for this operator")
    for session in sessions:
        crud.terminate_session(db, session.id)
    return {"message": "Session(s) killed successfully"}
    
@app.get("/devices")
def get_operator_devices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user is an operator
    if current_user.role != "operator":
        raise HTTPException(status_code=403, detail="Only operators can access this endpoint")
    
    # Get all profiles assigned to this operator
    user_profiles = db.query(models.UserProfile).filter(models.UserProfile.operator_id == current_user.id).all()
    
    if not user_profiles:
        return {"devices": []}
    
    # Get the profile IDs
    profile_ids = [up.profile_id for up in user_profiles]
    
    # Get all profiles with their device groups
    profiles = db.query(models.Profile)\
        .filter(models.Profile.id.in_(profile_ids))\
        .options(joinedload(models.Profile.device_group))\
        .all()
    
    # Get all device group IDs
    device_group_ids = [profile.device_group_id for profile in profiles if profile.device_group_id]
    
    # Get all devices in these device groups
    devices = db.query(models.Device)\
        .filter(models.Device.device_group_id.in_(device_group_ids))\
        .all()
    
    # Format the response
    result = []
    for device in devices:
        device_data = {
            "id": device.id,
            "ip_address": device.ip_address,
            "port": device.port,
            "connection_type": device.connection_type,
            "username": device.username,
            "device_type": device.device_type,
            "location": device.location,
            "controlled_feature": device.controlled_feature,
            "device_group_id": device.device_group_id,
            # Include the device group name
            "device_group_name": next((p.device_group.group_name for p in profiles 
                                     if p.device_group_id == device.device_group_id), None)
        }
        # Add device to result if not already there
        if not any(d["id"] == device.id for d in result):
            result.append(device_data)
    
    return {"devices": result}

