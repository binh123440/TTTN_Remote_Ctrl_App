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

const DeviceGroupsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [deviceGroups, setDeviceGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/device-groups/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDeviceGroups(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching device groups:', error.response?.data || error.message);
        setError('Failed to load device groups. Please try again.');
        setLoading(false);
      });
  }, [token]);

  const handleDeleteDeviceGroup = async (groupId) => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      await axios.delete(`${API_BASE_URL}/device-groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Cập nhật danh sách nhóm thiết bị sau khi xóa
      setDeviceGroups((prev) => prev.filter((group) => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting device group:', error.response?.data || error.message);
      setError('Failed to delete device group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Device Groups
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/device-groups/new')}
          >
            Create Device Group
          </Button>
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
                <TableCell>Group Name</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deviceGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.id}</TableCell>
                  <TableCell>{group.group_name}</TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>
                        <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/device-groups/edit/${group.id}`)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteDeviceGroup(group.id)}
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

export default DeviceGroupsPage;