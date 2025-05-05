import json
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from .models import User, Device, DeviceGroup, CommandList, Profile, UserProfile, Session as DbSession, Log, Reading

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# User CRUD
# def get_user_by_email(db: Session, email: str):
#     return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email_or_phone: str):
    # Vì không có phone_number trong model, nên chỉ check email hoặc username
    return db.query(User).filter(User.email == email_or_phone).first()

def get_user_by_email_or_phone(db: Session, email_or_phone: str):
    return db.query(User).filter((User.email == email_or_phone) | (User.phone_number == email_or_phone)).first()

def get_user_by_phone_number(db: Session, phone_number: str):
    return db.query(User).filter(User.phone_number == phone_number).first()

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, username: str, email: str, password: str, role: str, phone_number: Optional[str] = None):
    # phone_number được bỏ qua vì không có trong model User
    hashed_password = pwd_context.hash(password)
    new_user = User(
        username=username,
        email=email,
        password=hashed_password,  
        role=role,
        phone_number=phone_number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def update_password(db: Session, user: User, new_password: str):
    user.password = pwd_context.hash(new_password) 
    db.commit()
    db.refresh(user)
    return user

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def update_user(db: Session, user_id: int, user_data: dict):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    for key, value in user_data.items():
        if key == "password" and value:
            value = pwd_context.hash(value)
        if value is not None:
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True

# DeviceGroup CRUD
def get_device_group_by_name(db: Session, group_name: str):
    return db.query(DeviceGroup).filter(DeviceGroup.group_name == group_name).first()

def get_device_group(db: Session, device_group_id: int):
    return db.query(DeviceGroup).filter(DeviceGroup.id == device_group_id).first()

def create_device_group(db: Session, group_name: str, description: Optional[str] = None):
    db_device_group = DeviceGroup(
        group_name=group_name,
        description=description
    )
    db.add(db_device_group)
    db.commit()
    db.refresh(db_device_group)
    return db_device_group

def update_device_group(db: Session, device_group_id: int, device_group_data: dict):
    db_device_group = get_device_group(db, device_group_id)
    if not db_device_group:
        return None
    
    for key, value in device_group_data.items():
        if value is not None:
            setattr(db_device_group, key, value)
    
    db.commit()
    db.refresh(db_device_group)
    return db_device_group

def delete_device_group(db: Session, device_group_id: int):
    db_device_group = get_device_group(db, device_group_id)
    if not db_device_group:
        return False
    
    # Check if device group has devices
    devices = db.query(Device).filter(Device.device_group_id == device_group_id).all()
    if devices:
        return False  # Cannot delete device group with devices
    
    db.delete(db_device_group)
    db.commit()
    return True

# Device CRUD
def get_device(db: Session, device_id: int):
    return db.query(Device).filter(Device.id == device_id).first()

def get_device_by_ip(db: Session, ip_address: str):
    return db.query(Device).filter(Device.ip_address == ip_address).first()

def get_device_by_username(db: Session, username: str):
    return db.query(Device).filter(Device.username == username).first()

def create_device(
    db: Session, 
    ip_address: str,
    port: str,
    connection_type: str,
    username: str,
    password: str,
    device_type: str,
    location: Optional[str],
    controlled_feature: str,
    private_key: str,
    owner_id: int,
    device_group_id: int
):
    # Kiểm tra nếu username đã tồn tại
    existing_device = get_device_by_username(db, username)
    if existing_device:
        raise ValueError("Device with this username already exists")
    
    # Hash mật khẩu
    hashed_password = pwd_context.hash(password)
    
    db_device = Device(
        ip_address=ip_address,
        port=port,
        connection_type=connection_type,
        username=username,
        password_hash=hashed_password,
        device_type=device_type,
        location=location,
        controlled_feature=controlled_feature,
        private_key=private_key,
        owner_id=owner_id,
        device_group_id=device_group_id
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

def update_device(db: Session, device_id: int, device_data: dict):
    db_device = get_device(db, device_id)
    if not db_device:
        return None
    
    for key, value in device_data.items():
        if key == "password" and value:
            setattr(db_device, "password_hash", pwd_context.hash(value))
        elif value is not None:
            setattr(db_device, key, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

def delete_device(db: Session, device_id: int):
    db_device = get_device(db, device_id)
    if not db_device:
        return False
    
    db.delete(db_device)
    db.commit()
    return True

# CommandList CRUD
def get_command_list_by_name(db: Session, name: str):
    return db.query(CommandList).filter(CommandList.name == name).first()

def get_command_list(db: Session, command_list_id: int):
    return db.query(CommandList).filter(CommandList.id == command_list_id).first()

def create_command_list(db: Session, name: str, commands: List[str]):
    db_command_list = CommandList(
        name=name,
        commands=json.dumps(commands)
    )
    db.add(db_command_list)
    db.commit()
    db.refresh(db_command_list)
    return db_command_list

def update_command_list(db: Session, command_list_id: int, command_list_data: dict):
    db_command_list = get_command_list(db, command_list_id)
    if not db_command_list:
        return None
    
    for key, value in command_list_data.items():
        if key == "commands" and value is not None:
            setattr(db_command_list, key, json.dumps(value))
        elif value is not None:
            setattr(db_command_list, key, value)
    
    db.commit()
    db.refresh(db_command_list)
    return db_command_list

def delete_command_list(db: Session, command_list_id: int):
    db_command_list = get_command_list(db, command_list_id)
    if not db_command_list:
        return False
    
    # Check if command list is used in profiles
    profiles = db.query(Profile).filter(Profile.command_list_id == command_list_id).all()
    if profiles:
        return False  # Cannot delete command list used in profiles
    
    db.delete(db_command_list)
    db.commit()
    return True

# Profile CRUD
def get_profile_by_name(db: Session, profile_name: str):
    return db.query(Profile).filter(Profile.name == profile_name).first()

def get_profile(db: Session, profile_id: int):
    return db.query(Profile).filter(Profile.id == profile_id).first()

def create_profile(db: Session, profile_name: str, team_lead_id: int, command_list_id: int, device_group_id: int):
    db_profile = Profile(
        name=profile_name,  # Đổi từ profile_name thành name
        team_lead_id=team_lead_id,
        command_list_id=command_list_id,
        device_group_id=device_group_id
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_profile(db: Session, profile_id: int, profile_data: dict):
    db_profile = get_profile(db, profile_id)
    if not db_profile:
        return None
    
    for key, value in profile_data.items():
        # Handle name field differently because DB field is possibly different
        if key == "name" and value is not None:
            setattr(db_profile, "name", value)
        elif value is not None:
            setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

def delete_profile(db: Session, profile_id: int):
    db_profile = get_profile(db, profile_id)
    if not db_profile:
        return False
    
    # First delete all assignments for this profile
    db.query(UserProfile).filter(UserProfile.profile_id == profile_id).delete()
    
    db.delete(db_profile)
    db.commit()
    return True

# UserProfile CRUD
def assign_profile_to_operator(db: Session, profile_id: int, operator_id: int):
    db_user_profile = UserProfile(
        profile_id=profile_id,
        operator_id=operator_id
    )
    db.add(db_user_profile)
    db.commit()
    db.refresh(db_user_profile)
    return db_user_profile

def get_operator_profiles(db: Session, operator_id: int):
    return db.query(UserProfile).filter(UserProfile.operator_id == operator_id).all()

def unassign_profile_from_operator(db: Session, profile_id: int, operator_id: int):
    # Find the user profile assignment
    db_user_profile = db.query(UserProfile).filter(
        UserProfile.profile_id == profile_id,
        UserProfile.operator_id == operator_id
    ).first()
    
    # If found, delete it
    if db_user_profile:
        db.delete(db_user_profile)
        db.commit()
        return True
    return False

# Session CRUD
def create_session(db: Session, operator_id: int, device_id: int):
    db_session = DbSession(
        operator_id=operator_id,
        device_id=device_id,
        status="active"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_active_sessions(db: Session):
    return db.query(DbSession).filter(DbSession.status == "active").all()

def terminate_session(db: Session, session_id: int):
    session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if session:
        session.status = "killed"
        session.ended_at = func.now()
        db.commit()
        db.refresh(session)
    return session

# Log CRUD
def create_log(db: Session, user_id: int, device_id: int, command: str, result: str):
    db_log = Log(
        user_id=user_id,
        device_id=device_id,
        command=command,
        result=result
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# Reading CRUD
def create_reading(db: Session, device_id: int, temperature: Optional[float] = None, humidity: Optional[float] = None):
    db_reading = Reading(
        device_id=device_id,
        temperature=temperature,
        humidity=humidity
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


def operator_can_access_device_and_command(db: Session, operator_id: int, device_ip: str, command: str):
    # Lấy device theo IP
    device = get_device_by_ip(db, device_ip)
    if not device:
        return False, "Device not found"
    # Lấy tất cả profile của operator
    user_profiles = get_operator_profiles(db, operator_id)
    for user_profile in user_profiles:
        profile = get_profile(db, user_profile.profile_id)
        if not profile:
            continue
        # Kiểm tra device group
        if device.device_group_id == profile.device_group_id:
            # Kiểm tra command
            command_list = get_command_list(db, profile.command_list_id)
            if not command_list:
                continue
            commands = json.loads(command_list.commands)
            for allowed_cmd in commands:
                if command.strip().startswith(allowed_cmd.strip()):
                    return True, ""
            return False, "Command not allowed in your profile"
    return False, "You are not allowed to access this device"

def update_session_detail(db, session_id, detail):
    session = db.query(DbSession).get(session_id)
    if session:
        session.detail = detail
        db.commit()
        db.refresh(session)
    return session

def create_log(db, user_id, device_id, command, result):
    log = Log(
        user_id=user_id,
        device_id=device_id,
        command=command,
        result=result  # nên là chuỗi JSON
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


