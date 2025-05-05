from flask import Blueprint, jsonify, request
from network.scanner import get_local_ip, scan_network, get_hotspot_devices
from network.ssh_client import execute_ssh_command

api_bp = Blueprint('api', __name__)

@api_bp.route('/scan', methods=['GET'])
def scan():
    local_ip = get_local_ip()
    base_ip = '.'.join(local_ip.split('.')[:3])
    devices = scan_network(base_ip)
    return jsonify(devices)

@api_bp.route('/hotspot', methods=['GET'])
def hotspot_devices():
    devices = get_hotspot_devices()
    return jsonify(devices)

@api_bp.route('/ssh', methods=['POST'])
def ssh_command():
    data = request.json
    
    # Kiểm tra dữ liệu đầu vào
    required_fields = ['ip', 'username', 'password', 'command']
    for field in required_fields:
        if field not in data:
            return jsonify({"status": "Error", "message": f"Missing required field: {field}"}), 400
    
    result = execute_ssh_command(
        ip=data['ip'],
        username=data['username'],
        password=data['password'],
        command=data['command'],
        port=data.get('port', 22)
    )
    
    return jsonify(result)