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
