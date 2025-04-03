from sqlalchemy.orm import Session
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email_or_phone(db: Session, email_or_phone: str):
    return db.query(User).filter((User.email == email_or_phone) | (User.phone_number == email_or_phone)).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, username: str, phone_number: str, email: str, password: str, role: str):
    hashed_password = pwd_context.hash(password)
    new_user = User(
        username=username,
        phone_number=phone_number,
        email=email,
        password=hashed_password,
        role=role,
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

def get_device_by_ip(db: Session, ip_address: str):
    device = db.query(Device).filter(Device.ip_address == ip_address).first()
    if not device:
        raise ValueError("Device not found")
    return device

def add_device(db: Session, name: str, ip_address: str, port: int, connection_type: str, username: str, password: str = None, private_key: str = None, owner_id: int = None):
    new_device = Device(
        name=name,
        ip_address=ip_address,
        port=port,
        connection_type=connection_type,
        username=username,
        password=password,
        private_key=private_key,
        owner_id=owner_id
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    return new_device
 