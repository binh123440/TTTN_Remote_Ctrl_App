from database import Base, engine
from models import User

# Tạo bảng trong cơ sở dữ liệu
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")