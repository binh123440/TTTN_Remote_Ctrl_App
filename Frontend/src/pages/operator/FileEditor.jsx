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
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const FileEditor = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('accessToken');

  const steps = ['Select Device', 'Enter Credentials', 'Specify File', 'Edit File'];

  useEffect(() => {
    fetchDevices();
  }, []);

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


  const handleNext = async () => {
    if (activeStep === 0 && !selectedDevice) {
      setError('Please select a device');
      return;
    }
    
    if (activeStep === 1 && (!username || !password)) {
      setError('Please enter both username and password');
      return;
    }

    if (activeStep === 2 && !filePath) {
      setError('Please enter file path');
      return;
    }

    if (activeStep === 2) {
      // Get file content before advancing to edit step
      await getFileContent();
    }
    
    setError('');
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getFileContent = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/ssh',
        {
          ip: selectedDevice,
          username,
          password,
          command: `cat ${filePath}`,
          port: 22
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

  const saveFile = async () => {
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
          port: 22
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.error) {
        setError(`Error saving file: ${response.data.error}`);
      } else {
        setError('');
        setOriginalContent(fileContent);
        alert('File saved successfully');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader title="File Editor" />
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
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Specify file to edit</Typography>
              <TextField
                fullWidth
                label="File Path"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                margin="normal"
                required
                placeholder="/etc/network/interfaces"
              />
              {error && <Box color="error.main" mb={2}>{error}</Box>}
              <Box mt={2} display="flex" gap={2}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Load File'}
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Editing file: {filePath}
              </Typography>
              
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
              
              {error && <Box color="error.main" mb={2}>{error}</Box>}
              
              <Box mt={2} display="flex" justifyContent="space-between">
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setFileContent(originalContent)}
                    disabled={fileContent === originalContent || loading}
                    sx={{ mr: 2 }}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="contained"
                    onClick={saveFile}
                    disabled={fileContent === originalContent || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save File'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FileEditor;