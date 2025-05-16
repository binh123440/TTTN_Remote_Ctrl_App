import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Lấy DATABASE_URL từ biến môi trường hoặc sử dụng giá trị mặc định
DATABASE_URL = os.getenv("DATABASE_URL")

# Tạo đối tượng engine
engine = create_engine(DATABASE_URL)

# Tạo lớp cơ sở cho các model
Base = declarative_base()

# Tạo phiên làm việc
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Hàm để lấy phiên làm việc
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
