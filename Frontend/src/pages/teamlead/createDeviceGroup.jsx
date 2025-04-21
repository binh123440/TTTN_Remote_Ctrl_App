import React, { useState, useEffect } from 'react';
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

const CreateDeviceGroup = () => {
  const { token } = useAuth();
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    group_name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  
  useEffect(() => {
    if (id) {
      // Nếu có ID, tải dữ liệu nhóm thiết bị để chỉnh sửa
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/device-groups/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setFormData(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching device group:', error.response?.data || error.message);
          setError('Failed to load device group data. Please try again.');
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
      ? axios.put(`${API_BASE_URL}/device-groups/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : axios.post(`${API_BASE_URL}/device-groups/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

    apiCall
      .then(() => {
        alert(id ? 'Device Group updated successfully!' : 'Device Group created successfully!');
        navigate('/device-groups');
      })
      .catch((error) => {
        console.error('Error saving device group:', error.response?.data || error.message);
        setError('Failed to save device group: ' + (error.response?.data?.detail || 'Please try again.'));
        setLoading(false);
      });
  };

  return (
    <MainCard
      title={
        <Typography variant="h5" fontWeight="bold">
          {id ? 'Edit Device Group' : 'Create Device Group'}
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
            label="Group Name"
            fullWidth
            margin="normal"
            value={formData.group_name}
            onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
            required
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Box display="flex" justifyContent="center" gap={2} mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {id ? 'Update Device Group' : 'Create Device Group'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/device-groups')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </>
      )}
    </MainCard>
  );
};

export default CreateDeviceGroup;