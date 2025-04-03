from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Thêm cột role

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ip_address = Column(String, unique=True, nullable=False)
    port = Column(Integer, nullable=False)
    connection_type = Column(String, nullable=False)  # "ssh" hoặc "rdp"
    username = Column(String, nullable=False)
    password = Column(String, nullable=True)  # Có thể null nếu dùng private key
    private_key = Column(String, nullable=True)  # Chỉ dùng cho SSH
    owner_id = Column(Integer, ForeignKey("users.id"))  # Liên kết với User
    owner = relationship("User")