from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Đổi từ password_hash thành password
    role = Column(String, nullable=False)
    
    # Relationships - giữ nguyên để đảm bảo tính nhất quán
    profiles_created = relationship("Profile", back_populates="team_lead")
    assigned_profiles = relationship("UserProfile", back_populates="operator")
    sessions = relationship("Session", back_populates="operator")
    logs = relationship("Log", back_populates="user")
    devices = relationship("Device", back_populates="owner")

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(20), nullable=False)
    port = Column(String(10), nullable=False)
    connection_type = Column(String(20), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    device_type = Column(String(50), server_default="NodeMCU")
    location = Column(String(100))
    controlled_feature = Column(String(100), nullable=False)
    private_key = Column(Text, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_group_id = Column(Integer, ForeignKey("device_groups.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="devices")
    device_group = relationship("DeviceGroup", back_populates="devices")
    readings = relationship("Reading", back_populates="device")
    sessions = relationship("Session", back_populates="device")
    logs = relationship("Log", back_populates="device")

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    command = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="logs")
    device = relationship("Device", back_populates="logs")
    
    # Note: Partitioning by month is handled at the database level and not in SQLAlchemy

class Reading(Base):
    __tablename__ = "readings"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    device = relationship("Device", back_populates="readings")

class DeviceGroup(Base):
    __tablename__ = "device_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profiles = relationship("Profile", back_populates="device_group")
    devices = relationship("Device", back_populates="device_group")

class CommandList(Base):
    __tablename__ = "command_lists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    commands = Column(JSONB, nullable=False)  # JSONB for PostgreSQL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profiles = relationship("Profile", back_populates="command_list")

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    team_lead_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    command_list_id = Column(Integer, ForeignKey("command_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    device_group_id = Column(Integer, ForeignKey("device_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # Đổi từ profile_name thành name
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team_lead = relationship("User", back_populates="profiles_created")
    command_list = relationship("CommandList", back_populates="profiles")
    device_group = relationship("DeviceGroup", back_populates="profiles")
    user_profiles = relationship("UserProfile", back_populates="profile")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="user_profiles")
    operator = relationship("User", back_populates="assigned_profiles")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    detail = Column(Text)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True))
    
    # Relationships
    operator = relationship("User", back_populates="sessions")
    device = relationship("Device", back_populates="sessions")