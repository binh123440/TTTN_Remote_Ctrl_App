import smtplib
import random
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

OTP_STORE = {}  # Lưu OTP tạm thời


def generate_otp():
    return str(random.randint(100000, 999999))


def send_email_otp(email: str):
    otp = generate_otp()
    OTP_STORE[email] = otp

    server = smtplib.SMTP(os.getenv("EMAIL_HOST"), os.getenv("EMAIL_PORT"))
    server.starttls()
    server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
    message = f"Subject: Password Reset OTP\n\nYour OTP code is: {otp}"
    server.sendmail(os.getenv("EMAIL_USER"), email, message)
    server.quit()


def verify_otp(email_or_phone: str, otp: str):
    return OTP_STORE.get(email_or_phone) == otp


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra mật khẩu đã băm."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
