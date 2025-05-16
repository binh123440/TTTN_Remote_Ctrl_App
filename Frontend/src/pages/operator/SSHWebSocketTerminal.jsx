// filepath: Frontend/src/pages/operator/SSHWebSocketTerminal.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const SSHWebSocketTerminal = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDeviceObj, setSelectedDeviceObj] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRawMode, setIsRawMode] = useState(true);

  const terminalRef = useRef(null);
  const term = useRef(null);
  const fitAddon = useRef(null);
  const socketRef = useRef(null);
  const inputBufferRef = useRef('');

  const token = localStorage.getItem('accessToken');
  const steps = ['Select Device', 'Enter Credentials', 'Open Terminal'];

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      const deviceObj = devices.find(d => d.id === selectedDevice);
      setSelectedDeviceObj(deviceObj || null);
    } else {
      setSelectedDeviceObj(null);
    }
  }, [selectedDevice, devices]);

  // Initialize terminal AND connect WebSocket when activeStep is 2 and all details are present
  useEffect(() => {
    // Chỉ thực hiện nếu đang ở bước 2, có DOM ref, và chưa có instance terminal
    if (activeStep === 2 && terminalRef.current && !term.current) {
      console.log("Initializing terminal...");
      term.current = new Terminal({
        cursorBlink: true,
        scrollback: 1000,
        tabStopWidth: 8,
        fontFamily: 'monospace',
        fontSize: 14,
        theme: {
          background: '#000',
          foreground: '#0f0'
        }
      });
      fitAddon.current = new FitAddon();
      term.current.loadAddon(fitAddon.current);
      term.current.open(terminalRef.current);
      fitAddon.current.fit();
      term.current.focus();

      term.current.onKey(({ key, domEvent }) => {
        if (isRawMode) {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(key);
          }
        } else {
          if (domEvent.key === 'Enter') {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(inputBufferRef.current + '\n');
            }
            term.current.write('\r\n');
            inputBufferRef.current = '';
          } else if (domEvent.key === 'Backspace') {
            if (inputBufferRef.current.length > 0) {
              inputBufferRef.current = inputBufferRef.current.slice(0, -1);
              term.current.write('\b \b');
            }
          } else if (
            domEvent.key.length === 1 &&
            !domEvent.ctrlKey &&
            !domEvent.altKey &&
            !domEvent.metaKey
          ) {
            inputBufferRef.current += key;
            term.current.write(key);
          }
        }
      });

      const handleResize = () => {
        if (fitAddon.current) fitAddon.current.fit();
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && term.current) {
            const dimensions = fitAddon.current.proposeDimensions();
            if (dimensions) {
                socketRef.current.send(JSON.stringify({
                    type: 'resize',
                    cols: dimensions.cols,
                    rows: dimensions.rows
                }));
            }
        }
      };
      window.addEventListener('resize', handleResize);
      setTimeout(() => handleResize(), 100); // Initial fit

      // --- LOGIC KẾT NỐI WEBSOCKET ĐƯỢC CHUYỂN VÀO ĐÂY ---
      if (selectedDeviceObj && selectedDeviceObj.ip_address && username && password) {
        console.log("Attempting WebSocket connection...");
        term.current.writeln('Attempting to connect...');

        const ws = new WebSocket('ws://localhost:8000/ws/ssh');
        socketRef.current = ws; // Gán socketRef ngay khi tạo

        ws.onopen = () => {
          term.current.writeln('\r\n[WebSocket connected]\r\n');
          ws.send(JSON.stringify({
            ip: selectedDeviceObj.ip_address,
            port: selectedDeviceObj.port || 22,
            username,
            password
          }));
        };

        ws.onmessage = (event) => {
          if (term.current) {
            term.current.write(event.data);
          }
        };

        ws.onerror = (errorEvent) => {
          console.error('WebSocket error:', errorEvent);
          if (term.current) {
            term.current.writeln('\r\n[WebSocket error. Check console for details.]\r\n');
          }
          setError('WebSocket connection error.');
        };

        ws.onclose = (closeEvent) => {
          if (term.current) {
            term.current.writeln(`\r\n[Disconnected. Code: ${closeEvent.code}, Reason: ${closeEvent.reason || 'N/A'}]\r\n`);
          }
          // Không tự động quay lại bước trước, để người dùng nhấn nút "Back" hoặc "Disconnect"
        };
      } else {
        console.warn("Missing connection details for WebSocket:", {selectedDeviceObj, username, password});
        if(term.current) term.current.writeln("\r\n[ERROR] Missing connection details. Cannot connect.\r\n");
        setError("Missing device details or credentials to connect.");
      }
      // --- KẾT THÚC LOGIC KẾT NỐI WEBSOCKET ---

      return () => {
        console.log("Cleaning up terminal and WebSocket...");
        window.removeEventListener('resize', handleResize);
        if (socketRef.current) { // Đóng WebSocket trước
          socketRef.current.close();
          socketRef.current = null;
        }
        if (term.current) {
          term.current.dispose();
          term.current = null;
        }
        fitAddon.current = null; // Dọn dẹp fitAddon
        inputBufferRef.current = ''; // Reset input buffer
      };
    }
  }, [activeStep, isRawMode, selectedDeviceObj, username, password]); // Thêm selectedDeviceObj, username, password vào dependencies

  const fetchDevices = async () => {
    // ... (giữ nguyên)
    try {
      const response = await axios.get('http://localhost:8000/devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data.devices)) {
        setDevices(response.data.devices);
      }
      else if (Array.isArray(response.data)) {
        setDevices(response.data);
      }
      else {
        console.warn("API response for /devices is not in the expected format. Received:", response.data);
        setDevices([]);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
      setDevices([]);
    }
  };

  const handleNext = () => {
    setError('');
    if (activeStep === 0 && !selectedDevice) {
      setError('Please select a device');
      return;
    }
    if (activeStep === 1 && (!username || !password)) {
      setError('Please enter both username and password');
      return;
    }
    
    // Chỉ chuyển step, useEffect sẽ lo việc kết nối khi activeStep là 2
    if (activeStep < 2) {
        if (activeStep === 1 && term.current) { // Nếu quay lại từ step 2 rồi lên lại
            term.current.clear(); // Xóa terminal cũ trước khi setup lại
        }
        setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (activeStep === 2) {
        // useEffect cleanup sẽ tự động đóng WebSocket và dispose terminal
        // khi activeStep thay đổi
    }
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // handleConnect không còn cần thiết nữa vì logic đã chuyển vào useEffect
  // const handleConnect = () => { ... };

  const handleDisconnect = () => {
    // useEffect cleanup sẽ xử lý việc đóng socket và dispose terminal khi activeStep thay đổi
    // Nút này chủ yếu để người dùng chủ động ngắt kết nối và có thể quay lại bước trước
    if (socketRef.current) {
      socketRef.current.close(); // Chủ động đóng socket
      // socketRef.current = null; // Cleanup trong useEffect sẽ làm điều này
    }
    if (term.current) {
        term.current.writeln("\r\n[INFO] Disconnecting by user request...\r\n");
    }
    // Có thể quay lại bước 1 hoặc 0 tùy ý
    // setActiveStep(1);
    // setError('');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader title="SSH Terminal (WebSocket)" />
        <Divider />
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select Device</Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="device-select-label">Device</InputLabel>
                <Select
                  labelId="device-select-label"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  label="Device"
                >
                  {devices.map(device => (
                    // Giả sử device object có id, ip_address, và port
                    <MenuItem key={device.id} value={device.id}>
                      {device.ip_address} (Port: {device.port || 'N/A'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleNext} disabled={!selectedDevice}>Next</Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Enter Credentials</Typography>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
              />
              <Box mt={2} display="flex" gap={2}>
                <Button variant="outlined" onClick={handleBack}>Back</Button>
                {/* Nút này giờ chỉ gọi handleNext để chuyển step */}
                <Button variant="contained" onClick={handleNext} disabled={!username || !password}>
                  Open Terminal
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Terminal Session ({selectedDeviceObj?.ip_address})
              </Typography>
              <Box
                ref={terminalRef}
                sx={{
                  bgcolor: '#000', // Màu nền của terminal
                  color: '#0f0',   // Màu chữ của terminal
                  height: 400,    // Chiều cao của terminal
                  borderRadius: 1,
                  border: '1px solid #ccc', // Thêm border để dễ nhìn
                  // boxShadow: '0 0 10px #0f0', // Hiệu ứng đổ bóng nếu muốn
                  fontFamily: 'monospace',
                  fontSize: 14,
                  overflow: 'hidden', // Quan trọng để FitAddon hoạt động đúng
                  p: 1 // Padding nhỏ bên trong
                }}
              />
              <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Button variant="outlined" onClick={handleBack}>Back to Credentials</Button>
                <Button
                  variant={isRawMode ? "contained" : "outlined"}
                  color={isRawMode ? "success" : "primary"}
                  onClick={() => setIsRawMode(prev => !prev)}
                >
                  {isRawMode ? "Raw Mode: ON" : "Raw Mode: OFF"}
                </Button>
                <Button variant="contained" color="error" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </Box>
            </Box>
          )}

          {error && (
            <Typography color="error" mt={2} sx={{ whiteSpace: 'pre-wrap'}}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SSHWebSocketTerminal;