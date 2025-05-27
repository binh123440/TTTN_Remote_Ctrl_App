import re
import string

def format_ip(ip):
    parts = ip.split('.')
    if len(parts) != 4:
        raise ValueError("Invalid IP address format")
    return '.'.join(str(int(part)) for part in parts)

def handle_exception(e):
    return {"error": str(e)}
