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
  Checkbox,
  Alert
} from '@mui/material';
import MainCard from '../../components/MainCard';
import { API_BASE_URL } from '../../config';

const CommandsPage = () => {
  const { token } = useAuth();
  const [commandLists, setCommandLists] = useState([]);
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Thêm trạng thái cho lỗi
  const navigate = useNavigate();

  // Fetch command lists from API
  useEffect(() => {

    axios
      .get(API_BASE_URL + '/command-lists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setCommandLists(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching command lists:', error);
        setError('Failed to load command lists.');
        setLoading(false);
      });
  }, [token]);

  // Handle delete selected commands
  const handleDelete = async (ids) => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
    if (ids.length === 0) {
      setError('Please select at least one command to delete.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (ids.length === 1) {
        // Xóa một command list
        await axios.delete(`${API_BASE_URL}/command-lists/${ids[0]}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Xóa nhiều command lists
        await axios.delete(`${API_BASE_URL}/command-lists/bulk`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: { ids }, // Đảm bảo ids là một mảng số nguyên
        });
      }

      // Cập nhật danh sách command lists sau khi xóa
      setCommandLists((prev) => prev.filter((cmd) => !ids.includes(cmd.id)));
      setSelectedCommands([]);
    } catch (error) {
      console.error('Error deleting commands:', error.response?.data || error.message);

      // Kiểm tra nếu error.response?.data là một đối tượng
      const errorMessage =
        typeof error.response?.data === 'string'
          ? error.response?.data
          : error.response?.data?.detail || 'Failed to delete commands. Please try again.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Command Lists
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/commands/new')}
            >
              Create New Command
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDelete(selectedCommands)} // Xóa nhiều command lists
              disabled={selectedCommands.length === 0 || loading}
            >
              Delete Selected
            </Button>
          </Box>
        </Box>
      }
    >
      <Box p={3}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Alert>
        )}
        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Command</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commandLists.map((command) => (
                  <TableRow key={command.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCommands.includes(command.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCommands((prev) => [...prev, command.id]);
                          } else {
                            setSelectedCommands((prev) => prev.filter((id) => id !== command.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{command.id}</TableCell>
                    <TableCell>{command.name}</TableCell>
                    <TableCell>
                      {command.commands.map((cmd, index) => (
                        <Typography key={index} style={{ whiteSpace: 'pre-line' }}>
                          {typeof cmd === 'string' ? cmd : `${cmd.command}: ${cmd.description}`}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/commands/edit/${command.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete([command.id])} // Xóa một command list
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
      </Box>
    </MainCard>
  );
};

export default CommandsPage;