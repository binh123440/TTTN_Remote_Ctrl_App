from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Thêm cột role

class CommandList(Base):
    __tablename__ = "command_lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    commands = Column(Text, nullable=False)  # Lưu dạng JSON string
    profiles = relationship("Profile", back_populates="command_list")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    command_list_id = Column(Integer, ForeignKey("command_lists.id"), nullable=False)
    device_group_id = Column(Integer, nullable=False)
    command_list = relationship("CommandList", back_populates="profiles")