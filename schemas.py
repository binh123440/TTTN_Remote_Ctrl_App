import json
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Union, Any
from datetime import datetime

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

# Schemas cho Command List
class CommandListCreate(BaseModel):
    name: str
    commands: List[str]

class CommandListResponse(BaseModel):
    id: int
    name: str
    commands: List[str]

    class Config:
        from_attributes = True

# Schemas cho Profile
class ProfileCreate(BaseModel):
    name: str
    command_list_id: int
    device_group_id: int

class ProfileResponse(BaseModel):
    id: int
    name: str
    command_list_id: int
    device_group_id: int

    class Config:
        from_attributes = True
        
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Union[str, None] = None
    role: Union[str, None] = None
# Thêm phần này vào file schemas.py

class DeviceGroupCreate(BaseModel):
    group_name: str
    description: Optional[str] = None

class DeviceGroupResponse(BaseModel):
    id: int
    group_name: str
    description: Optional[str] = None

class DeviceBase(BaseModel):
    ip_address: str
    port: str
    connection_type: str
    username: str
    device_type: str = "NodeMCU"
    location: Optional[str] = None
    controlled_feature: str
    device_group_id: int

class DeviceCreate(DeviceBase):
    password: str  # Mật khẩu dạng clear text, sẽ được hash
    private_key: str

class DeviceResponse(DeviceBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        # Thêm mapping cho password_hash -> password
        alias_generator = lambda field: "password_hash" if field == "password" else field

# Thêm vào schemas.py cho các chức năng cập nhật

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    phone_number: Optional[str] = None
    role: str
    
    class Config:
        from_attributes = True
        
class DeviceUpdate(BaseModel):
    ip_address: Optional[str] = None
    port: Optional[str] = None
    connection_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    device_type: Optional[str] = None
    location: Optional[str] = None
    controlled_feature: Optional[str] = None
    private_key: Optional[str] = None
    device_group_id: Optional[int] = None

class DeviceGroupUpdate(BaseModel):
    group_name: Optional[str] = None
    description: Optional[str] = None

class CommandListUpdate(BaseModel):
    name: Optional[str] = None
    commands: Optional[List[str]] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    command_list_id: Optional[int] = None
    device_group_id: Optional[int] = None
