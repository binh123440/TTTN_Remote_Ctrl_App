import paramiko
import time
import socket

def execute_ssh_command(ip, username, password, command, port=22, timeout=10, read_timeout=30, max_retries=3):
    """
    Kết nối SSH tới thiết bị và thực thi lệnh
    
    Args:
        ip: Địa chỉ IP của thiết bị
        username: Tên đăng nhập SSH
        password: Mật khẩu SSH
        command: Lệnh cần thực thi
        port: Cổng SSH (mặc định 22)
        timeout: Thời gian timeout cho kết nối (giây)
        read_timeout: Thời gian timeout cho đọc output (giây)
        max_retries: Số lần thử lại tối đa
        
    Returns:
        dict: Kết quả thực thi lệnh
    """
    result = {
        "ip": ip,
        "status": "Failed",
        "output": "",
        "error": ""
    }
    
    retry_count = 0
    while retry_count < max_retries:
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Kết nối với timeout được chỉ định
            client.connect(ip, port=port, username=username, password=password, timeout=timeout)
            
            # Thực thi lệnh
            stdin, stdout, stderr = client.exec_command(command)
            
            # Thiết lập timeout cho channel
            channel = stdout.channel
            channel.settimeout(read_timeout)
            
            # Đọc output với timeout
            result["output"] = stdout.read().decode('utf-8', errors='replace')
            result["error"] = stderr.read().decode('utf-8', errors='replace')
            result["status"] = "Success"
            
            client.close()
            return result
            
        except socket.timeout:
            retry_count += 1
            error_msg = f"Connection timed out (attempt {retry_count}/{max_retries})"
            result["error"] = error_msg
            time.sleep(1)  # Đợi 1 giây trước khi thử lại
            
        except paramiko.ssh_exception.SSHException as e:
            retry_count += 1
            error_msg = f"SSH error: {str(e)} (attempt {retry_count}/{max_retries})"
            result["error"] = error_msg
            time.sleep(1)
            
        except Exception as e:
            result["error"] = f"Error: {str(e)}"
            return result  # Đối với các lỗi khác, không thử lại
    
    return result