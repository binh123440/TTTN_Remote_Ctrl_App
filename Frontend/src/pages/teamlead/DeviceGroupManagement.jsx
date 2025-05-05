import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import axios from 'axios';

const DeviceGroupManagement = () => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceGroups, setDeviceGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchDeviceGroups();
  }, []);

  const fetchDeviceGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/device-groups/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeviceGroups(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch device groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!groupName) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      await axios.post('http://localhost:8000/device-groups/', {
        group_name: groupName,
        description: description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroupName('');
      setDescription('');
      fetchDeviceGroups();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create device group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8000/device-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDeviceGroups();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete device group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader title="Create Device Group" />
            <Divider />
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Group Name"
                  margin="normal"
                  name="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  margin="normal"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                />
                {error && <Box color="error.main" mt={2}>{error}</Box>}
                <Box mt={2}>
                  <Button
                    color="primary"
                    variant="contained"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Device Group'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Device Groups" />
            <Divider />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Group Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deviceGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>{group.id}</TableCell>
                        <TableCell>{group.group_name}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(group.id)}
                          >
                            X
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeviceGroupManagement;