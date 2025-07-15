import socket
import subprocess
import platform
import threading
import re
import ipaddress
import concurrent.futures
import time
import json

import psutil

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_hostname(ip=None):
    try:
        if ip:
            return socket.gethostbyaddr(ip)[0]
        else:
            return socket.gethostname()
    except Exception:
        return "Unknown"

def ping(ip):
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    command = ['ping', param, '1', '-w', '500', ip]  # Thêm timeout 500ms
    try:
        output = subprocess.check_output(command, stderr=subprocess.DEVNULL, timeout=1)
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
        return False

def scan_network(base_ip):
    devices = []
    results = {}
    MAX_WORKERS = 20  # Giới hạn số lượng thread

    def worker(ip):
        try:
            status = ping(ip)
            hostname = get_hostname(ip) if status else "Unknown"
            return ip, {
                "ip": ip,
                "hostname": hostname,
                "status": "Online" if status else "Offline"
            }
        except Exception as e:
            return ip, {
                "ip": ip,
                "hostname": "Error",
                "status": f"Error: {str(e)}"
            }

    # Sử dụng ThreadPoolExecutor thay vì tạo thread thủ công
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ip = {executor.submit(worker, f"{base_ip}.{i}"): i for i in range(1, 255)}
        for future in concurrent.futures.as_completed(future_to_ip):
            try:
                ip, result = future.result()
                if result["status"] == "Online":
                    results[ip] = result
            except Exception:
                pass

    for ip in sorted(results):
        devices.append(results[ip])
    
    return devices

def scan_ports(ip, ports):
    """Scan specific ports on a given IP address"""
    open_ports = []
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)  # Quick timeout for responsive scanning
            result = sock.connect_ex((ip, port))
            sock.close()
            if result == 0:  # Port is open
                open_ports.append(port)
        except:
            pass  # Ignore errors
    return open_ports

def get_hotspot_devices():
    """Get devices connected to the Windows hotspot with port scanning"""
    devices = []
    
    # Common ports to check
    common_ports = [22, 23, 80, 443, 8080, 21, 25, 3389]
    
    try:
        # Kiểm tra Mobile Hotspot bằng cách tìm adapter phù hợp
        ipconfig = subprocess.check_output('ipconfig /all', shell=True).decode('utf-8', errors='ignore')
        
        # Tìm các adapter di động phổ biến
        mobile_adapters = [
            "Mobile Hotspot",
            "Local Area Connection* ",
            "Microsoft Wi-Fi Direct Virtual Adapter",
            "Wireless LAN"  # Backup check
        ]
        
        hotspot_ip = None
        # Tìm adapter hotspot trong ipconfig
        for adapter in mobile_adapters:
            matches = re.findall(rf'{adapter}.*?IPv4 Address[.\s]*: ([\d.]+)', ipconfig, re.DOTALL | re.IGNORECASE)
            if matches:
                hotspot_ip = matches[0]
                break
        
        # Kiểm tra các IP phổ biến của Mobile Hotspot (192.168.137.x hoặc 172.20.10.x)
        if not hotspot_ip:
            common_ips = [r'192\.168\.137\.\d+', r'172\.20\.10\.\d+', r'192\.168\.\d+\.\d+']
            for pattern in common_ips:
                matches = re.findall(pattern, ipconfig)
                if matches:
                    hotspot_ip = matches[0]
                    break
                
        if not hotspot_ip:
            return [{"ip": "N/A", "hostname": "N/A", "status": "Cannot detect Mobile Hotspot adapter", "mac": "N/A", "open_ports": []}]
        
        # Lấy danh sách thiết bị từ bảng ARP
        arp_output = subprocess.check_output('arp -a', shell=True).decode('utf-8', errors='ignore')
        
        # Lấy subnet từ IP
        ip_parts = hotspot_ip.split('.')
        subnet_prefix = '.'.join(ip_parts[0:3]) + '.'
        
        # Device discovery and port scanning with ThreadPoolExecutor
        device_list = []
        
        # Tìm các thiết bị trong bảng ARP có cùng subnet với hotspot
        for line in arp_output.splitlines():
            if subnet_prefix in line:
                parts = re.split(r'\s+', line.strip())
                if len(parts) >= 3:
                    ip = parts[0]
                    # Bỏ qua IP của chính hotspot
                    if ip == hotspot_ip:
                        continue
                    
                    mac = parts[1]
                    
                    # Bỏ qua địa chỉ MAC không hợp lệ
                    if mac == "ff-ff-ff-ff-ff-ff" or mac.count("-") != 5:
                        continue
                    
                    try:
                        hostname = get_hostname(ip)
                    except:
                        hostname = "Unknown"
                    
                    device_list.append({
                        "ip": ip,
                        "hostname": hostname,
                        "status": "Connected",
                        "mac": mac
                    })
        
        # Use ThreadPoolExecutor for parallel port scanning
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Create a map of futures to devices
            future_to_device = {
                executor.submit(scan_ports, device["ip"], common_ports): device
                for device in device_list
            }
            
            # Process completed futures
            for future in concurrent.futures.as_completed(future_to_device):
                device = future_to_device[future]
                try:
                    open_ports = future.result()
                    # Add the open ports to device info
                    device["open_ports"] = open_ports
                    devices.append(device)
                except Exception as exc:
                    # Add the device without ports info
                    device["open_ports"] = []
                    device["error"] = str(exc)
                    devices.append(device)
        
        # Nếu không tìm thấy thiết bị nào, trả về thông báo
        if not devices:
            devices.append({
                "ip": "N/A", 
                "hostname": "N/A", 
                "status": f"No devices found on hotspot network ({hotspot_ip})", 
                "mac": "N/A",
                "open_ports": []
            })
            
    except Exception as e:
        devices.append({
            "ip": "N/A", 
            "hostname": "N/A", 
            "status": f"Error: {str(e)}", 
            "mac": "N/A",
            "open_ports": []
        })
    
    return devices

def scan_all_networks():
    subnets = []
    for iface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family == 2:  # AF_INET
                ip = addr.address
                netmask = addr.netmask
                if ip and netmask and not ip.startswith("127."):
                    try:
                        network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
                        subnets.append(str(network))
                    except Exception:
                        pass

    all_devices = []
    for subnet in subnets:
        base_ip = str(subnet).rsplit('.', 1)[0]
        devices = scan_network(base_ip)
        all_devices.extend(devices)
    return all_devices

def scan_docker_containers():
    """
    Scan for Docker containers with specific focus on Linux VMs with SSH access
    
    Returns:
        List of discovered Docker Linux containers with SSH access
    """
    devices = []
    
    try:
        print("Getting list of running Docker containers...")
        
        # Get list of running containers
        ps_cmd = 'docker ps --format "{{.ID}}|{{.Names}}|{{.Image}}|{{.Ports}}|{{.Status}}"'
        ps_output = subprocess.check_output(ps_cmd, shell=True).decode('utf-8', errors='ignore')
        
        print(f"Found Docker containers: {ps_output}")
        
        if not ps_output.strip():
            return [{"ip": "N/A", "hostname": "N/A", "status": "No Docker containers running", "container_name": "N/A", "open_ports": []}]
        
        # Process each container
        for line in ps_output.splitlines():
            if '|' not in line:
                continue
                
            parts = line.split('|')
            if len(parts) < 4:
                continue
                
            container_id = parts[0].strip()
            container_name = parts[1].strip()
            image = parts[2].strip()
            ports_str = parts[3].strip()
            status = parts[4].strip() if len(parts) > 4 else "Running"
            
            print(f"Processing container: {container_name}, ID: {container_id}, Ports: {ports_str}")
            
            # Only include Linux-related images (this can be expanded as needed)
            if not any(linux_image in image.lower() for linux_image in ["ubuntu", "debian", "alpine", "centos", "fedora", "linux"]):
                print(f"Skipping non-Linux container: {image}")
                continue
            
            # Extract open ports and host mappings
            port_mappings = []
            ssh_host_port = None
            
            # Look for port mappings like 0.0.0.0:2201->22/tcp
            for mapping in re.findall(r'([\d\.]+):(\d+)->(\d+)/(\w+)', ports_str):
                host_ip, host_port, container_port, protocol = mapping
                port_mappings.append({
                    "host_ip": host_ip,
                    "host_port": host_port,
                    "container_port": container_port,
                    "protocol": protocol
                })
                
                # Remember SSH port mapping
                if container_port == "22" and protocol == "tcp":
                    ssh_host_port = host_port
            
            # Get container IP address
            try:
                ip_cmd = f'docker inspect -f "{{{{.NetworkSettings.IPAddress}}}}" {container_id}'
                ip = subprocess.check_output(ip_cmd, shell=True).decode('utf-8', errors='ignore').strip()
                
                if not ip:
                    # Try getting IP through networks
                    ip_cmd = f'docker inspect -f "{{{{json .NetworkSettings.Networks}}}}" {container_id}'
                    networks_json = subprocess.check_output(ip_cmd, shell=True).decode('utf-8', errors='ignore').strip()
                    
                    try:
                        network_data = json.loads(networks_json)
                        for network_name, network_info in network_data.items():
                            if network_info.get('IPAddress'):
                                ip = network_info['IPAddress']
                                break
                    except Exception as e:
                        print(f"Error parsing network data: {e}")
                        
                if not ip:
                    ip = "host_mapped"
            except Exception as e:
                print(f"Error getting container IP: {e}")
                ip = "host_mapped"
            
            # Get container details - especially to detect Linux
            try:
                inspect_cmd = f'docker inspect {container_id}'
                inspect_output = subprocess.check_output(inspect_cmd, shell=True).decode('utf-8', errors='ignore')
                inspect_data = json.loads(inspect_output)
                
                # Get more container details
                container_hostname = inspect_data[0].get('Config', {}).get('Hostname', container_name)
                cmd = inspect_data[0].get('Config', {}).get('Cmd', [])
                entrypoint = inspect_data[0].get('Config', {}).get('Entrypoint', [])
                
            except Exception as e:
                print(f"Error inspecting container: {e}")
                container_hostname = container_name
                cmd = []
                entrypoint = []
            
            # Create device entry
            device = {
                "ip": ip,
                "container_id": container_id,
                "container_name": container_name,
                "hostname": container_hostname,
                "image": image,
                "status": status,
                "linux_vm": True,
                "open_ports": [],
                "port_mappings": port_mappings
            }
            
            # Add SSH access information
            if ssh_host_port:
                device["ssh_access"] = f"ssh -p {ssh_host_port} root@localhost"
                device["ssh_port"] = ssh_host_port
                # Default credentials based on your Dockerfile
                device["default_username"] = "root"
                device["default_password"] = "password"
            
            # Check for SSH access by attempting to connect
            if ip != "host_mapped" and not ssh_host_port:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(0.5)
                    result = sock.connect_ex((ip, 22))
                    sock.close()
                    if result == 0:
                        device["open_ports"].append(22)
                        device["direct_ssh"] = f"ssh root@{ip}"
                except Exception as e:
                    print(f"Error checking SSH port: {e}")
            
            # Add to devices list
            devices.append(device)
            print(f"Added Linux container: {device}")
        
        # If no Linux containers found
        if not devices:
            devices.append({
                "ip": "N/A", 
                "hostname": "N/A", 
                "status": "No Linux containers found",
                "container_name": "N/A",
                "open_ports": []
            })
                
    except Exception as e:
        print(f"Error scanning Docker containers: {str(e)}")
        devices.append({
            "ip": "N/A", 
            "hostname": "N/A", 
            "status": f"Error scanning Docker: {str(e)}",
            "container_name": "N/A",
            "open_ports": []
        })
    
    return devices

def get_all_adapter_devices():
    """
    Quét tất cả các IP của các network adapter (bao gồm cả VMnet1, VMnet8, Ethernet, Wi-Fi, ...)
    Giữ lại logic quét hotspot, bổ sung quét subnet của mọi adapter.
    """
    import psutil
    import ipaddress

    devices = []
    common_ports = [22, 23, 80, 443, 8080, 21, 25, 3389]

    try:
        # --- Quét Mobile Hotspot như cũ ---
        ipconfig = subprocess.check_output('ipconfig /all', shell=True).decode('utf-8', errors='ignore')
        mobile_adapters = [
            "Mobile Hotspot",
            "Local Area Connection* ",
            "Microsoft Wi-Fi Direct Virtual Adapter",
            "Wireless LAN"
        ]
        hotspot_ip = None
        for adapter in mobile_adapters:
            matches = re.findall(rf'{adapter}.*?IPv4 Address[.\s]*: ([\d.]+)', ipconfig, re.DOTALL | re.IGNORECASE)
            if matches:
                hotspot_ip = matches[0]
                break
        if not hotspot_ip:
            common_ips = [r'192\.168\.137\.\d+', r'172\.20\.10\.\d+', r'192\.168\.\d+\.\d+']
            for pattern in common_ips:
                matches = re.findall(pattern, ipconfig)
                if matches:
                    hotspot_ip = matches[0]
                    break
        if hotspot_ip:
            arp_output = subprocess.check_output('arp -a', shell=True).decode('utf-8', errors='ignore')
            ip_parts = hotspot_ip.split('.')
            subnet_prefix = '.'.join(ip_parts[0:3]) + '.'
            device_list = []
            for line in arp_output.splitlines():
                if subnet_prefix in line:
                    parts = re.split(r'\s+', line.strip())
                    if len(parts) >= 3:
                        ip = parts[0]
                        if ip == hotspot_ip:
                            continue
                        mac = parts[1]
                        if mac == "ff-ff-ff-ff-ff-ff" or mac.count("-") != 5:
                            continue
                        try:
                            hostname = get_hostname(ip)
                        except:
                            hostname = "Unknown"
                        device_list.append({
                            "ip": ip,
                            "hostname": hostname,
                            "status": "Connected",
                            "mac": mac
                        })
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                future_to_device = {
                    executor.submit(scan_ports, device["ip"], common_ports): device
                    for device in device_list
                }
                for future in concurrent.futures.as_completed(future_to_device):
                    device = future_to_device[future]
                    try:
                        open_ports = future.result()
                        device["open_ports"] = open_ports
                        device["adapter"] = "Mobile Hotspot"
                        devices.append(device)
                    except Exception as exc:
                        device["open_ports"] = []
                        device["error"] = str(exc)
                        device["adapter"] = "Mobile Hotspot"
                        devices.append(device)
            if not device_list:
                devices.append({
                    "ip": "N/A",
                    "hostname": "N/A",
                    "status": f"No devices found on hotspot network ({hotspot_ip})",
                    "mac": "N/A",
                    "open_ports": [],
                    "adapter": "Mobile Hotspot"
                })
        else:
            devices.append({
                "ip": "N/A",
                "hostname": "N/A",
                "status": "Cannot detect Mobile Hotspot adapter",
                "mac": "N/A",
                "open_ports": [],
                "adapter": "Mobile Hotspot"
            })

        # --- Quét tất cả các subnet của các adapter ---
        subnets = []
        for iface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family == 2:  # AF_INET
                    ip = addr.address
                    netmask = addr.netmask
                    if ip and netmask and not ip.startswith("127."):
                        try:
                            network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
                            subnets.append((iface, str(network)))
                        except Exception:
                            pass

        scanned_ips = set([d["ip"] for d in devices if d["ip"] != "N/A"])
        for iface, subnet in subnets:
            base_ip = subnet.rsplit('.', 1)[0]
            # Tránh quét lại các IP đã biết
            if base_ip in scanned_ips:
                continue
            devices_in_subnet = scan_network(base_ip)
            devices.extend(devices_in_subnet)
            scanned_ips.update([d["ip"] for d in devices_in_subnet if d["ip"] != "N/A"])
        
    except Exception as e:
        devices.append({
            "ip": "N/A", 
            "hostname": "N/A", 
            "status": f"Error: {str(e)}", 
            "mac": "N/A",
            "open_ports": []
        })
    
    return devices