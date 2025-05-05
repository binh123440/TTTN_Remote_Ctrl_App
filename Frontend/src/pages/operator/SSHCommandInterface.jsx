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
  Autocomplete
} from '@mui/material';
import axios from 'axios';

const SSHCommandInterface = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedDeviceObj, setSelectedDeviceObj] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [command, setCommand] = useState('');
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedCommands, setAllowedCommands] = useState([]);
  const token = localStorage.getItem('accessToken');

  const steps = ['Select Device', 'Enter Credentials', 'Send Commands'];

  useEffect(() => {
    fetchDevices();
  }, []);

  // When device selection changes, update the selected device object and fetch allowed commands
  useEffect(() => {
    if (selectedDevice) {
      const deviceObj = devices.find(d => d.ip_address === selectedDevice);
      setSelectedDeviceObj(deviceObj);
      
      if (deviceObj) {
        fetchAllowedCommandsForDevice(deviceObj.device_group_id);
      }
    }
  }, [selectedDevice, devices]);

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
      // Use the new endpoint to get device-specific commands
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

  const handleNext = () => {
    if (activeStep === 0 && !selectedDevice) {
      setError('Please select a device');
      return;
    }
    
    if (activeStep === 1 && (!username || !password)) {
      setError('Please enter both username and password');
      return;
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const executeCommand = async () => {
    if (!command.trim()) {
      setError('Please enter a command');
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

      // Add command and its response to terminal output
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

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader title="SSH Command Interface" />
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
                    Device Group: {selectedDeviceObj.device_group_name}
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
                value={username || (selectedDeviceObj?.username || '')}
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
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Execute Commands</Typography>
              
              {/* Terminal Display */}
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
              
              {/* Editable Combobox for Commands */}
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
              
              {error && <Box color="error.main" mt={2}>{error}</Box>}
              <Box mt={3}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SSHCommandInterface;