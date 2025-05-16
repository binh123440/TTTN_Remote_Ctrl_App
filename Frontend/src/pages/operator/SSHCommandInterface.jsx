import { useState, useEffect } from 'react';
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Tabs,
  Tab,
  CircularProgress,
  Icon,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EnhancedSSHInterface = () => {
  // Common state
  const [activeStep, setActiveStep] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDeviceObj, setSelectedDeviceObj] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedCommands, setAllowedCommands] = useState([]);
  const token = localStorage.getItem('accessToken');
  const [activeSession, setActiveSession] = useState(null);
  
  // SSH Terminal specific state
  const [command, setCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  
  // File Editor specific state
  const [mode, setMode] = useState('terminal'); // 'terminal' or 'editor'
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  // Thêm state cho Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const navigate = useNavigate();

  const steps = ['Select Device', 'Enter Credentials', 'SSH Terminal'];

  useEffect(() => {
    const init = async () => {
      console.log('Initializing Enhanced SSH Interface');
      await fetchDevices();
      await checkActiveSession();
    };
    
    init();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      const deviceObj = devices.find(d => d.ip_address === selectedDevice);
      setSelectedDeviceObj(deviceObj);
      
      if (deviceObj) {
        fetchAllowedCommandsForDevice(deviceObj.device_group_id);
      }
    }
  }, [selectedDevice, devices]);

  // Thêm interval để kiểm tra session định kỳ
  useEffect(() => {
    // Kiểm tra session status mỗi 10 giây
    const sessionCheckInterval = setInterval(() => {
      if (activeStep === 2) { // Chỉ kiểm tra khi đang ở bước terminal
        checkSessionStatus();
      }
    }, 10000); // 10000ms = 10 giây
    
    return () => clearInterval(sessionCheckInterval);
  }, [activeStep]);

  // Kết nối WebSocket (nếu backend hỗ trợ)
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const ws = new WebSocket(`ws://localhost:8000/ws/sessions/${userId}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'session_killed') {
        handleSessionKilled();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      ws.close();
    };
  }, []);

  // Thêm trong useEffect khi component mount
  useEffect(() => {
    // Thiết lập interceptor để bắt lỗi authentication
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && 
           (error.response.status === 401 || error.response.status === 403) &&
           activeStep === 2) {
          handleSessionKilled();
        }
        return Promise.reject(error);
      }
    );
    
    // Cleanup
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [activeStep]);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:8000/devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data.devices || []);
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
    }
  };

  const fetchAllowedCommandsForDevice = async (deviceGroupId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/device-groups/${deviceGroupId}/commands`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && response.data.commands) {
        setAllowedCommands(response.data.commands);
      } else {
        setAllowedCommands([]);
      }
    } catch (err) {
      console.error('Failed to fetch allowed commands:', err);
      setAllowedCommands([]);
    }
  };

  const updateSessionDeviceId = async (deviceId) => {
    try {
      await axios.put(
        'http://localhost:8000/session/update-device',
        { device_id: deviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Session updated with device ID:', deviceId);
    } catch (err) {
      console.error('Failed to update session device ID:', err);
    }
  };

  // Cập nhật handleNext
  const handleNext = async () => {
    // Kiểm tra session
    if (!(await checkSessionBeforeAction())) {
      return;
    }
    
    if (activeStep === 0 && !selectedDevice) {
      setError('Please select a device');
      return;
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Cập nhật hàm executeCommand
  const executeCommand = async () => {
    // Kiểm tra session trước khi thực hiện lệnh
    if (!(await checkSessionBeforeAction())) {
      return;
    }
    
    if (!command.trim()) {
      setError('Please enter a command');
      return;
    }
  
    // Kiểm tra nếu đang yêu cầu chỉnh sửa file (lệnh nano, vi, vim, edit)
    if (command.match(/^\s*(nano|vi|vim|edit)\s+([^\s]+)/)) {
      const match = command.match(/^\s*(nano|vi|vim|edit)\s+([^\s]+)/);
      const editorCmd = match[1];
      const filepath = match[2];
      
      // Ghi lệnh vào terminal output
      setTerminalOutput([
        ...terminalOutput,
        { type: 'command', content: command },
        { type: 'response', content: `Opening ${filepath} in editor...` }
      ]);
      
      // Chuyển sang chế độ chỉnh sửa file
      setFilePath(filepath);
      setMode('editor');
      await getFileContent(filepath);
      return;
    }
  
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/ssh',
        {
          ip: selectedDevice,
          username,
          password,
          command,
          port: selectedDeviceObj?.port || 22
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setTerminalOutput([
        ...terminalOutput,
        { type: 'command', content: command },
        { 
          type: 'response', 
          content: response.data.output || response.data.error || JSON.stringify(response.data) 
        }
      ]);
      setCommand('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to execute command');
      setTerminalOutput([
        ...terminalOutput,
        { type: 'command', content: command },
        { type: 'error', content: err.response?.data?.detail || 'Error executing command' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getFileContent = async (path) => {
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/ssh',
        {
          ip: selectedDevice,
          username,
          password,
          command: `cat ${path}`,
          port: selectedDeviceObj?.port || 22
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        setError(`Error fetching file: ${response.data.error}`);
        return false;
      }

      const content = response.data.output || '';
      setFileContent(content);
      setOriginalContent(content);
      setError('');
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch file content');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm saveFile
  const saveFile = async () => {
    // Kiểm tra session trước khi lưu file
    if (!(await checkSessionBeforeAction())) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create a temp file with the new content
      const tempFileName = `/tmp/edit_${Date.now()}.tmp`;
      const escapedContent = fileContent.replace(/'/g, "'\\''");
      
      const commands = [
        `cat > ${tempFileName} << 'EOL'`,
        escapedContent,
        'EOL',
        `sudo mv ${tempFileName} ${filePath}`,
        'echo "File saved successfully"'
      ].join('\n');

      const response = await axios.post(
        'http://localhost:8000/ssh',
        {
          ip: selectedDevice,
          username,
          password,
          command: commands,
          port: selectedDeviceObj?.port || 22
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        setError(`Error saving file: ${response.data.error}`);
      } else {
        setError('');
        setOriginalContent(fileContent);
        
        // Thêm thông báo lưu file vào terminal output
        setTerminalOutput([
          ...terminalOutput,
          { type: 'response', content: `File ${filePath} saved successfully` }
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật các hàm khác tương tự
  const exitEditor = async () => {
    // Kiểm tra session
    if (!(await checkSessionBeforeAction())) {
      return;
    }
    
    // Nếu có thay đổi chưa lưu, hiển thị xác nhận
    if (fileContent !== originalContent) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setMode('terminal');
      }
    } else {
      setMode('terminal');
    }
  };

  // Cập nhật hàm disconnectFromDevice
  const disconnectFromDevice = async () => {
    // Kiểm tra session trước khi disconnect
    if (!(await checkSessionBeforeAction())) {
      return;
    }
    
    try {
      await axios.post(
        'http://localhost:8000/session/disconnect',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Reset state
      setActiveSession(null);
      setSelectedDevice('');
      setSelectedDeviceObj(null);
      setUsername('');
      setPassword('');
      setCommand('');
      setTerminalOutput([]);
      setMode('terminal');
      setFileContent('');
      setOriginalContent('');
      setFilePath('');
      setError('');
      
      // Quay về bước đầu tiên
      setActiveStep(0);
    } catch (err) {
      setError('Failed to disconnect from device');
      console.error(err);
    }
  };

  // Hàm kiểm tra status của session
  const checkSessionStatus = async () => {
    try {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) return;
      
      const response = await axios.get('http://localhost:8000/session/current', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      // Nếu không có session active, có thể session đã bị kill
      if (!response.data || 
          !response.data.session || 
          response.data.session.status !== 'active') {
        
        handleSessionKilled();
      }
    } catch (err) {
      // Nếu trả về 401/403, token hết hạn hoặc session bị kill
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleSessionKilled();
      }
    }
  };
  
  // Cải tiến hàm handleSessionKilled để tránh nhiều thông báo
const handleSessionKilled = () => {
  // Kiểm tra nếu đã hiển thị thông báo, không hiển thị lại
  if (snackbar.open) return;
  
  // Hiển thị snackbar
  setSnackbar({
    open: true,
    message: 'Phiên làm việc của bạn đã bị kết thúc bởi người giám sát',
    severity: 'error'
  });
  
  // Reset state
  setActiveSession(null);
  setSelectedDevice('');
  setSelectedDeviceObj(null);
  setUsername('');
  setPassword('');
  setCommand('');
  setTerminalOutput([]);
  setMode('terminal');
  setFileContent('');
  setOriginalContent('');
  setFilePath('');
  
  // Quay về trang login sau 3 giây
  setTimeout(() => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  }, 3000);
};
  
  // Đóng snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Thêm hàm kiểm tra session trước khi thực hiện các hành động
  const checkSessionBeforeAction = async () => {
    try {
      const currentToken = localStorage.getItem('accessToken');
      if (!currentToken) {
        handleSessionKilled();
        return false;
      }
      
      const response = await axios.get('http://localhost:8000/session/current', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      
      if (!response.data || 
          !response.data.session || 
          response.data.session.status !== 'active') {
        handleSessionKilled();
        return false;
      }
      
      return true;
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleSessionKilled();
      } else {
        console.error('Error checking session:', err);
      }
      return false;
    }
  };

  // Thêm hàm verifyCredentialsAndContinue sau các hàm khác
const verifyCredentialsAndContinue = async () => {
  if (!username || !password) {
    setError('Please enter both username and password');
    return;
  }

  try {
    setLoading(true);
    
    if (selectedDeviceObj) {
      await updateSessionDeviceId(selectedDeviceObj.id);
      console.log('Device ID updated in session:', selectedDeviceObj.id);
    }

    // khi session bị gián đoạn và kết nối lại
    if (selectedDeviceObj) {
      sessionStorage.setItem(`ssh_password_${selectedDeviceObj.id}`, password);
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  } catch (err) {
    setError('Failed to update session information');
    console.error('Session update error:', err);
  } finally {
    setLoading(false);
  }
};

// Thêm hàm checkActiveSession để kiểm tra và khôi phục session hiện tại
const checkActiveSession = async () => {
  try {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) {
      console.log('No access token found, cannot check session');
      return;
    }

    console.log('Checking active session...');
    const response = await axios.get('http://localhost:8000/session/current', {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    console.log('Session response:', response.data);
    
    if (response.data && response.data.session && 
        response.data.session.status === 'active' && 
        response.data.session.device_id) {
      
      setActiveSession(response.data.session);
      console.log('Active session found with device ID:', response.data.session.device_id);
      
      const deviceData = await fetchDeviceById(response.data.session.device_id);
      console.log('Device data:', deviceData);
      
      if (deviceData) {
        const deviceExists = devices.some(d => d.ip_address === deviceData.ip_address);
        
        if (!deviceExists) {
          await fetchDevices();
        }
        
        setSelectedDevice(deviceData.ip_address);
        setSelectedDeviceObj(deviceData);
        
        if (deviceData.username) {
          setUsername(deviceData.username);
        }
        
        if (deviceData.device_group_id) {
          await fetchAllowedCommandsForDevice(deviceData.device_group_id);
        }
        
        // Chuyển đến bước nhập thông tin đăng nhập
        console.log('Setting active step to 1 (Enter Credentials)');
        setActiveStep(1);
        
        // Khôi phục mật khẩu từ sessionStorage nếu có
        const savedPassword = sessionStorage.getItem(`ssh_password_${deviceData.id}`);
        if (savedPassword) {
          setPassword(savedPassword);
          console.log('Retrieved password from session storage');
        }
      } else {
        console.error('Device data not found for ID:', response.data.session.device_id);
      }
    } else {
      console.log('No active session with device found');
    }
  } catch (err) {
    console.error('Failed to check active session:', err);
    if (err.response) {
      console.error('Error response:', err.response.data);
    }
  }
};

// Thêm hàm fetchDeviceById để hỗ trợ checkActiveSession
const fetchDeviceById = async (deviceId) => {
  try {
    console.log(`Fetching device with ID: ${deviceId}`);
    const currentToken = localStorage.getItem('accessToken');
    
    const response = await axios.get(`http://localhost:8000/devices/${deviceId}`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    if (response.data && response.data.device) {
      console.log('Device found:', response.data.device);
      return response.data.device;
    }
    console.log('Device not found');
    return null;
  } catch (err) {
    console.error('Failed to fetch device by ID:', err);
    if (err.response) {
      console.error('Error data:', err.response.data);
    }
    return null;
  }
};

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader title="Enhanced SSH Terminal" />
        <Divider />
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Select a device</Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Device</InputLabel>
                <Select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required
                >
                  {devices.map((device) => (
                    <MenuItem key={device.id} value={device.ip_address}>
                      {device.ip_address} ({device.device_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedDeviceObj && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Device Group: {selectedDeviceObj.device_group_name || selectedDeviceObj.device_group_id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connection Type: {selectedDeviceObj.connection_type}
                  </Typography>
                </Box>
              )}
              {error && <Box color="error.main" mb={2}>{error}</Box>}
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Enter device credentials</Typography>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              {error && <Box color="error.main" mb={2}>{error}</Box>}
              <Box mt={2} display="flex" gap={2}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="contained" onClick={() => verifyCredentialsAndContinue()}>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              {mode === 'terminal' && (
                <>
                  <Typography variant="h6" gutterBottom>Execute Commands</Typography>
                  
                  {selectedDeviceObj && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="subtitle1">
                        Connected to: {selectedDeviceObj.ip_address} ({selectedDeviceObj.device_type})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Device Group: {selectedDeviceObj.device_group_name || selectedDeviceObj.device_group_id}
                      </Typography>
                      <Typography variant="body2">
                        <em>Tip: Use nano, vi, vim, or edit commands to edit files</em>
                      </Typography>
                    </Box>
                  )}
                  
                  <Paper 
                    sx={{ 
                      bgcolor: '#000', 
                      color: '#00FF00', 
                      p: 2, 
                      fontFamily: 'monospace', 
                      height: '300px',
                      overflowY: 'auto',
                      mb: 2
                    }}
                  >
                    {terminalOutput.map((line, index) => (
                      <Box key={index} mb={1}>
                        {line.type === 'command' ? (
                          <Typography sx={{ color: '#FFFFFF' }}>
                            $ {line.content}
                          </Typography>
                        ) : line.type === 'error' ? (
                          <Typography sx={{ color: '#FF0000' }}>
                            {line.content}
                          </Typography>
                        ) : (
                          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                            {line.content}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    {loading && <Typography>Executing command...</Typography>}
                  </Paper>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={9} md={10}>
                      <Autocomplete
                        freeSolo
                        value={command}
                        onChange={(event, newValue) => {
                          setCommand(newValue || '');
                        }}
                        inputValue={command}
                        onInputChange={(event, newValue) => {
                          setCommand(newValue || '');
                        }}
                        options={allowedCommands}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Command"
                            placeholder="Type or select a command"
                            fullWidth
                            onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={3} md={2}>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={executeCommand}
                        disabled={loading}
                        sx={{ height: '100%' }}
                      >
                        Send
                      </Button>
                    </Grid>
                  </Grid>
                </>
              )}

              {mode === 'editor' && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Editing: {filePath}
                    </Typography>
                    <Box>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={exitEditor}
                        startIcon={<Icon>arrow_back</Icon>}
                        sx={{ mr: 1 }}
                      >
                        Back to Terminal
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={saveFile}
                        startIcon={<Icon>save</Icon>}
                        disabled={loading || fileContent === originalContent}
                      >
                        Save
                      </Button>
                    </Box>
                  </Box>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={16}
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    variant="outlined"
                    margin="normal"
                    InputProps={{
                      style: { 
                        fontFamily: 'monospace',
                        fontSize: '14px'
                      }
                    }}
                    disabled={loading}
                  />
                  
                  {loading && (
                    <Box display="flex" justifyContent="center" my={2}>
                      <CircularProgress />
                    </Box>
                  )}
                </>
              )}
              
              {error && <Box color="error.main" mt={2}>{error}</Box>}
              
              <Box mt={3} display="flex" justifyContent="space-between">
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={disconnectFromDevice}
                  startIcon={<Icon>logout</Icon>}
                >
                  Disconnect
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Thêm Snackbar để hiển thị thông báo */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedSSHInterface;