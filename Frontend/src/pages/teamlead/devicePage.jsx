import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import MainCard from '../../components/MainCard';
import { API_BASE_URL } from '../../config';

const DevicesPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/devices/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDevices(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching devices:', error.response?.data || error.message);
        setError('Failed to load devices. Please try again.');
        setLoading(false);
      });
  }, [token]);

  const handleDeleteDevice = async (deviceId) => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Cập nhật danh sách thiết bị sau khi xóa
      setDevices((prev) => prev.filter((device) => device.id !== deviceId));
    } catch (error) {
      console.error('Error deleting device:', error.response?.data || error.message);
      setError('Failed to delete device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Devices List
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/devices/new')}
            >
              Create Device
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/device-groups')}
            >
              View Device Groups
            </Button>
          </Box>
        </Box>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Connection Type</TableCell>
                <TableCell>Device Group</TableCell>
                <TableCell>Controlled Feature</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>{device.ip_address}</TableCell>
                  <TableCell>{device.port}</TableCell>
                  <TableCell>{device.connection_type}</TableCell>
                  <TableCell>{device.device_group_id}</TableCell>
                  <TableCell>{device.controlled_feature}</TableCell>
                  <TableCell>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/devices/edit/${device.id}`)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteDevice(device.id)}
                        sx={{ ml: 2 }}
                    >
                        Delete
                    </Button>
                </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </MainCard>
  );
};

export default DevicesPage;