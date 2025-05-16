import sys
import os

# Thêm thư mục cha (src) vào Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Sau đó sử dụng các import tuyệt đối
from api.database import Base, engine
from api.models import User, Device, DeviceGroup, CommandList, Profile, UserProfile, Session, Log, Reading
from sqlalchemy import text

# Tạo bảng trong cơ sở dữ liệu
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")