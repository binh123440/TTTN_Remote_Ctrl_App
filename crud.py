import json
from typing import List  # Thêm dòng này
from sqlalchemy.orm import Session
from models import User, CommandList, Profile
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

# CRUD cho CommandList
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

# CRUD cho Profile
def get_profile_by_name(db: Session, name: str):
    return db.query(Profile).filter(Profile.name == name).first()

def create_profile(db: Session, name: str, command_list_id: int, device_group_id: int):
    db_profile = Profile(
        name=name,
        command_list_id=command_list_id,
        device_group_id=device_group_id
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile
