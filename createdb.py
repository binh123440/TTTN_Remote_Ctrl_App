from database import Base, engine
from models import User, Device, DeviceGroup, CommandList, Profile, UserProfile, Session, Log, Reading


# Tạo bảng trong cơ sở dữ liệu
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

# from sqlalchemy import text
# from database import engine

# with engine.connect() as connection:
#     connection.execute(text("ALTER TABLE command_lists ALTER COLUMN commands TYPE JSONB USING commands::jsonb"))
#     connection.commit()
#     print("Đã chuyển đổi cột commands từ TEXT sang JSONB")

# from sqlalchemy import text
# from database import engine

# with engine.connect() as connection:
#     # Thêm cột team_lead_id
#     connection.execute(text("ALTER TABLE profiles ADD COLUMN team_lead_id INTEGER"))
#     # Thêm khóa ngoại đến bảng users
#     connection.execute(text("ALTER TABLE profiles ADD CONSTRAINT fk_team_lead FOREIGN KEY (team_lead_id) REFERENCES users(id)"))
#     connection.commit()

# from sqlalchemy import text
# from database import engine

# with engine.connect() as connection:
#     # Thêm cột created_at
#     connection.execute(text("ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
#     connection.commit()
#     print("Đã thêm cột created_at vào bảng profiles!")