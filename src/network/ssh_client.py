import paramiko
import time

def execute_ssh_command(ip, username, password, command, port=22, timeout=10):
    """
    Kết nối SSH tới thiết bị và thực thi lệnh
    
    Args:
        ip: Địa chỉ IP của thiết bị
        username: Tên đăng nhập SSH
        password: Mật khẩu SSH
        command: Lệnh cần thực thi
        port: Cổng SSH (mặc định 22)
        timeout: Thời gian timeout (giây)
        
    Returns:
        dict: Kết quả thực thi lệnh
    """
    result = {
        "ip": ip,
        "status": "Failed",
        "output": "",
        "error": ""
    }
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(ip, port=port, username=username, password=password, timeout=timeout)
        
        stdin, stdout, stderr = client.exec_command(command)
        result["output"] = stdout.read().decode('utf-8')
        result["error"] = stderr.read().decode('utf-8')
        result["status"] = "Success"
        
        client.close()
    except Exception as e:
        result["error"] = str(e)
        
    return result