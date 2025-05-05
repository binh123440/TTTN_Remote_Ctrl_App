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
  CircularProgress,
  Paper,
  IconButton,
  List,
  ListItem,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import MainCard from '../../components/MainCard';
import { API_BASE_URL } from '../../config';

const CommandForm = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [commandsList, setCommandsList] = useState(['']); // Initialize with one empty command
  const [newCommand, setNewCommand] = useState('');
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
          setName(response.data.name);
          // Ensure commands are always treated as an array
          const fetchedCommands = Array.isArray(response.data.commands)
            ? response.data.commands
            : typeof response.data.commands === 'string'
            ? response.data.commands.split(',').map(cmd => cmd.trim()).filter(cmd => cmd)
            : [];

          setCommandsList(fetchedCommands.length > 0 ? fetchedCommands : ['']); // Ensure at least one field if empty
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching command list:', error);
          setError('Failed to load command list data.');
          setLoading(false);
        });
    }
  }, [id, token]);

  const handleCommandChange = (index, value) => {
    const updatedCommands = [...commandsList];
    updatedCommands[index] = value; // Store the value exactly as entered, including newlines
    setCommandsList(updatedCommands);
  };

  const handleAddCommand = () => {
    // Add the content of the 'New Command' field as a new command entry
    // Keep existing entries as they are
    setCommandsList([...commandsList, newCommand]);
    setNewCommand(''); // Clear the 'New Command' field
  };

  const handleRemoveCommand = (index) => {
    const updatedCommands = [...commandsList];
    updatedCommands.splice(index, 1);

    // Ensure there's always at least one command field if the list becomes empty
    if (updatedCommands.length === 0) {
      updatedCommands.push('');
    }

    setCommandsList(updatedCommands);
  };

  const handleSubmit = () => {
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a name for the command list.');
      return;
    }

    // Filter out commands that are completely empty or contain only whitespace/newlines
    const filteredCommands = commandsList.filter(cmd => cmd && cmd.trim() !== '');

    if (filteredCommands.length === 0) {
      setError('Please add at least one valid command.');
      return;
    }

    setLoading(true);
    setError(null);

    // Send the commands exactly as they are, preserving newlines
    const payload = {
      name: name.trim(),
      commands: filteredCommands
    };

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
            label="Command List Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Typography variant="h6" mt={4} mb={2}>
            Commands
            <Chip
              label={`${commandsList.filter(cmd => cmd && cmd.trim() !== '').length} commands`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <List sx={{ width: '100%' }}>
              {commandsList.map((command, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider sx={{ my: 1.5 }} />} {/* Increased spacing */}
                  <ListItem
                    disableGutters
                    secondaryAction={
                      <Tooltip title="Remove command">
                        {/* Use DeleteIcon */}
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveCommand(index)}
                          sx={{ alignSelf: 'flex-start', mt: 1 }} // Align icon top
                        >
                          <span role="img" aria-label="delete">❌</span> {/* Placeholder for DeleteIcon */}
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{ alignItems: 'flex-start' }} // Align items top
                  >
                    <TextField
                      fullWidth
                      label={`Command ${index + 1}`}
                      value={command}
                      onChange={(e) => handleCommandChange(index, e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Enter command (can be multi-line)"
                      multiline // Allow multiple lines
                      rows={3} // Start with 3 rows, adjust as needed
                      sx={{ mr: 1 }} // Add margin to separate from delete icon
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            {/* Section to add a new command entry field */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Button
                  startIcon="+"
                  onClick={() => setCommandsList([...commandsList, ''])} // Add an empty string for a new field
                  variant="outlined"
                  size="small"
                >
                  Add Another Command Field
                </Button>
            </Box>

             {/* Removed the single "New Command" input field as adding is handled above */}

          </Paper>

          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              size="large"
            >
              {id ? 'Update Command List' : 'Create Command List'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/commands')}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
          </Box>
        </>
      )}
    </MainCard>
  );
};

export default CommandForm;