import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext'; 
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import MainCard from '../../components/MainCard'; // Điều chỉnh đường dẫn theo cấu trúc dự án
import { API_BASE_URL } from '../../config';
const CommandForm = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', commands: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (id) {
      setLoading(true);
      axios
        .get(`${API_BASE_URL}/command-lists/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          setFormData(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching command list:', error);
          setError('Failed to load command list data.');
          setLoading(false);
        });
    }
  }, [id, token]);

  const handleSubmit = () => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
  
    console.log('Token:', token); // Debug token
    console.log('Payload:', formData); // Debug payload
  
    setLoading(true);
    setError(null);
  
    // Xử lý commands trước khi gửi
    const processedCommands = formData.commands
      .split(',')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd); // Loại bỏ các lệnh rỗng
  
    const payload = { ...formData, commands: processedCommands };
  
    const apiCall = id
      ? axios.put(`${API_BASE_URL}/command-lists/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : axios.post(`${API_BASE_URL}/command-lists/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
    apiCall
      .then(() => {
        alert(id ? 'Command List updated successfully!' : 'Command List created successfully!');
        navigate('/commands');
      })
      .catch((error) => {
        console.error('Error saving command list:', error.response?.data || error.message);
        setError('Failed to save command list: ' + (error.response?.data?.detail || 'Please try again.'));
        setLoading(false);
      });
  };
  return (
    <MainCard
      title={
        <Typography variant="h5" fontWeight="bold">
          {id ? 'Edit Command List' : 'Create Command List'}
        </Typography>
      }
    >
      <Typography variant="h6" mb={2}>
        {id ? 'Chỉnh sửa Command List' : 'Tạo Command List Mới'}
      </Typography>

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
            label="Tên Command List"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            label="Commands (phân cách bởi dấu phẩy)"
            fullWidth
            margin="normal"
            value={formData.commands}
            onChange={(e) =>
              setFormData({ ...formData, commands: e.target.value })
            }
            required
          />
          <Box display="flex" justifyContent="center" gap={2} mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {id ? 'Cập nhật' : 'Tạo Command List'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/commands')}
              disabled={loading}
            >
              Hủy
            </Button>
          </Box>
        </>
      )}
    </MainCard>
  );
};

export default CommandForm;