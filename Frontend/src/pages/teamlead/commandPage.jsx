import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  Checkbox
} from '@mui/material';
import MainCard from './MainCard'; // Giả sử bạn đã có component MainCard
import { API_BASE_URL } from '../../config';

const CommandsPage = () => {
  const [commandLists, setCommandLists] = useState([]);
  const [selectedCommands, setSelectedCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch command lists from API
  useEffect(() => {
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuZ29jaGFvIiwicm9sZSI6InRlYW1fbGVhZCIsImV4cCI6MTc0NDg4MjMwMX0.5sfZwmgi4k-1zv6pbpe_JTo4Id-xqFJlZkV1oNjGWVo`;
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
        setLoading(false);
      });
  }, []);

  // Handle delete selected commands
  const handleDelete = () => {
    setLoading(true);
    axios
      .delete(API_BASE_URL + '/command-lists/', { data: { ids: selectedCommands } })
      .then(() => {
        setCommandLists((prev) => prev.filter((cmd) => !selectedCommands.includes(cmd.id)));
        setSelectedCommands([]);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error deleting commands:', error);
        setLoading(false);
      });
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
              onClick={handleDelete}
              disabled={selectedCommands.length === 0}
            >
              Delete Selected
            </Button>
          </Box>
        </Box>
      }
    >
      <Box p={3}>
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
                  <TableCell>Actions</TableCell>
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
                            setSelectedCommands((prev) =>
                              prev.filter((id) => id !== command.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{command.id}</TableCell>
                    <TableCell>{command.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(`/commands/edit/${command.id}`)}
                      >
                        Edit
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