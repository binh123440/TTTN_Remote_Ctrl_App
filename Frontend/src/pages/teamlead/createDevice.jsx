import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import MainCard from '../../components/MainCard';
import { API_BASE_URL } from '../../config';
import { useParams } from 'react-router-dom';

const CreateDevice = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Lấy ID từ URL
  const [formData, setFormData] = useState({
    ip_address: '',
    port: '',
    connection_type: '',
    username: '',
    password: '',
    private_key: '',
    controlled_feature: '',
    device_group_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      // Nếu có ID, tải dữ liệu thiết bị để chỉnh sửa
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/devices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setFormData(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching device:', error.response?.data || error.message);
          setError('Failed to load device data. Please try again.');
          setLoading(false);
        });
    }
  }, [id, token]);

  const handleSubmit = () => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    const apiCall = id
      ? axios.put(`${API_BASE_URL}/devices/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : axios.post(`${API_BASE_URL}/devices/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

    apiCall
      .then(() => {
        alert(id ? 'Device updated successfully!' : 'Device created successfully!');
        navigate('/devices');
      })
      .catch((error) => {
        console.error('Error saving device:', error.response?.data || error.message);
        setError('Failed to save device: ' + (error.response?.data?.detail || 'Please try again.'));
        setLoading(false);
      });
  };

  return (
    <MainCard
      title={
        <Typography variant="h5" fontWeight="bold">
          Create Device
        </Typography>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            label="IP Address"
            fullWidth
            margin="normal"
            value={formData.ip_address}
            onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
            required
          />
          <TextField
            label="Port"
            fullWidth
            margin="normal"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
            required
          />
          <TextField
            label="Connection Type"
            fullWidth
            margin="normal"
            value={formData.connection_type}
            onChange={(e) => setFormData({ ...formData, connection_type: e.target.value })}
            required
          />
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <TextField
            label="Private Key"
            fullWidth
            margin="normal"
            value={formData.private_key}
            onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
            required
          />
          <TextField
            label="Controlled Feature"
            fullWidth
            margin="normal"
            value={formData.controlled_feature}
            onChange={(e) => setFormData({ ...formData, controlled_feature: e.target.value })}
            required
          />
          <TextField
            label="Device Group ID"
            fullWidth
            margin="normal"
            value={formData.device_group_id}
            onChange={(e) => setFormData({ ...formData, device_group_id: e.target.value })}
            required
          />
          <Box display="flex" justifyContent="center" gap={2} mt={2}>
            <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>
              Create Device
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => navigate('/devices')} disabled={loading}>
              Cancel
            </Button>
          </Box>
        </>
      )}
    </MainCard>
  );
};

export default CreateDevice;