import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography
} from '@mui/material';
import axios from 'axios';

const SessionHistoryView = () => {
  const [operators, setOperators] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [error, setError] = useState('');
  // Update token variable name to match the rest of the application
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch operators
      const usersResponse = await axios.get('http://localhost:8000/users/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only operators
      const operatorUsers = usersResponse.data.users.filter(user => user.role === 'operator');
      setOperators(operatorUsers);
      
      // Update the API endpoint to use /history instead of /sessions/active
      const sessionsResponse = await axios.get('http://localhost:8000/history/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Assuming the structure might be different, adjust as needed based on the actual response
      setSessions(sessionsResponse.data);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (operator) => {
    setSelectedOperator(operator);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleTerminateSession = async () => {
    try {
      setLoading(true);
      await axios.post(
        'http://localhost:8000/history/',
        { operator_id: selectedOperator.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to terminate session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader 
          title="Session History" 
          action={
            <Button
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {error && <Box color="error.main" mb={2}>{error}</Box>}
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>Active Sessions</Typography>
              <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Operator</TableCell>
                      <TableCell>Device</TableCell>
                      <TableCell>Started At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessions.length > 0 ? (
                      sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            {operators.find(op => op.id === session.operator_id)?.username || 'Unknown'}
                          </TableCell>
                          <TableCell>{session.device_id}</TableCell>
                          <TableCell>
                            {new Date(session.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              color="error"
                              size="small"
                              onClick={() => handleOpenDialog(
                                operators.find(op => op.id === session.operator_id)
                              )}
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No active sessions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" gutterBottom>Operators</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operators.length > 0 ? (
                      operators.map((operator) => (
                        <TableRow key={operator.id}>
                          <TableCell>{operator.username}</TableCell>
                          <TableCell>{operator.email}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleOpenDialog(operator)}
                            >
                              Terminate Sessions
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No operators found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Session Termination</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to terminate all active sessions for {selectedOperator?.username}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleTerminateSession} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Terminate Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionHistoryView;