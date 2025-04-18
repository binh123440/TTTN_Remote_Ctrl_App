from passlib.context import CryptContext

# Tạo context để hash mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash mật khẩu
password = "12345"  # Đây là mật khẩu gốc
hashed_password = pwd_context.hash(password)

# In ra mật khẩu đã được hash
print(f"Plain password: {password}")
print(f"Hashed password: {hashed_password}")