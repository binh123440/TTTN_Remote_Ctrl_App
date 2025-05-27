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
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  TableSortLabel,
  TablePagination,
  Tooltip
} from '@mui/material';
import axios from 'axios';

const SessionHistoryView = () => {
  const [operators, setOperators] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const token = localStorage.getItem('accessToken');

  // State for Command Logs
  const [commandLogs, setCommandLogs] = useState([]);
  const [commandLogsTotal, setCommandLogsTotal] = useState(0);
  const [commandLogLoading, setCommandLogLoading] = useState(false);
  const [commandLogError, setCommandLogError] = useState('');
  const [allLogDevicesForFilter, setAllLogDevicesForFilter] = useState([]); // STATE MỚI
  const [logDevicesLoading, setLogDevicesLoading] = useState(false); // State loading cho việc fetch device (tùy chọn)

  const [logFilters, setLogFilters] = useState({
    operatorId: '',
    deviceId: '',
    filterDate: '',
  });
  const [logSortBy, setLogSortBy] = useState('timestamp');
  const [logSortOrder, setLogSortOrder] = useState('desc');
  const [logPage, setLogPage] = useState(0);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);

  const fetchAllLogDevicesForFilter = async () => {
    setLogDevicesLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/logs/devices', { // API endpoint mới
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllLogDevicesForFilter(response.data || []);
    } catch (err) {
      console.error('Failed to fetch all log devices for filter:', err);
      // Có thể set một state lỗi riêng cho việc này nếu cần
    } finally {
      setLogDevicesLoading(false);
    }
  };
  
  const fetchCommandLogs = async () => {
    setCommandLogLoading(true);
    setCommandLogError('');
    try {
      const params = {
        operator_id: logFilters.operatorId || undefined,
        device_id: logFilters.deviceId || undefined,
        filter_date: logFilters.filterDate || undefined,
        sort_by: logSortBy,
        sort_order: logSortOrder,
        limit: logRowsPerPage,
        offset: logPage * logRowsPerPage,
      };
      
      const response = await axios.get('http://localhost:8000/logs/commands', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const fetchedLogs = response.data.items || [];
      setCommandLogs(fetchedLogs);
      setCommandLogsTotal(response.data.total || 0);

    } catch (err) {
      setCommandLogError(err.response?.data?.detail || 'Failed to fetch command logs');
    } finally {
      setCommandLogLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Fetches operators and sessions
    fetchAllLogDevicesForFilter(); // Gọi hàm fetch danh sách device cho bộ lọc khi component mount
  }, []); // Chạy một lần khi component mount

  useEffect(() => {
    if (tabValue === 2) { // Command Logs Tab
      fetchCommandLogs(); 
    }
  }, [tabValue, JSON.stringify(logFilters), logSortBy, logSortOrder, logPage, logRowsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const usersResponse = await axios.get('http://localhost:8000/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const operatorUsers = usersResponse.data.users.filter(user => user.role === 'operator');
      setOperators(operatorUsers);
      
      const sessionsResponse = await axios.get('http://localhost:8000/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(sessionsResponse.data);
      
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch data');
      console.error('Error fetching data:', err);
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
        'http://localhost:8000/kill-session',
        { operator_id: selectedOperator.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDialogOpen(false);
      fetchData(); 
      setSuccessMessage(`Sessions for ${selectedOperator.username} terminated successfully`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to terminate session');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 2) {
        setLogPage(0); // Reset page khi chuyển sang tab logs
    }
  };

  const handleLogFilterChange = (event) => {
    const { name, value } = event.target;
    setLogFilters(prev => ({ ...prev, [name]: value }));
    setLogPage(0); 
  };

  const handleLogSortRequest = (property) => {
    const isAsc = logSortBy === property && logSortOrder === 'asc';
    setLogSortOrder(isAsc ? 'desc' : 'asc');
    setLogSortBy(property);
    setLogPage(0);
  };

  const handleLogPageChange = (event, newPage) => {
    setLogPage(newPage);
  };

  const handleLogRowsPerPageChange = (event) => {
    setLogRowsPerPage(parseInt(event.target.value, 10));
    setLogPage(0);
  };

  const logTableHeaders = [
    { id: 'operator_username', label: 'Operator', sortable: true },
    { id: 'device_ip_address', label: 'Device', sortable: true }, // Sắp xếp theo device_ip_address hoặc device_name
    { id: 'command', label: 'Command', sortable: false },
    { id: 'result', label: 'Result', sortable: false },
    { id: 'timestamp', label: 'Timestamp', sortable: true },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Card>
        <CardHeader 
          title="Session Management" 
          action={
            <Button onClick={() => { fetchData(); if (tabValue === 2) fetchCommandLogs(); }} disabled={loading || commandLogLoading}>
              Refresh All
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {error && <Box color="error.main" mb={2}>{error}</Box>}
          {successMessage && <Box color="success.main" mb={2}>{successMessage}</Box>}
          
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }} indicatorColor="primary" textColor="primary">
            <Tab label="Active Sessions" />
            <Tab label="All Sessions" />
            <Tab label="Command Logs" />
          </Tabs>

          {loading && tabValue !==2 && (
            <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>
          )}

          {tabValue === 0 && !loading && (
            <TableContainer component={Paper}>
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
                  {sessions.filter(s => s.status === 'active').length > 0 ? (
                    sessions.filter(s => s.status === 'active').map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{session.operator_username || operators.find(op => op.id === session.operator_id)?.username || 'Unknown'}</TableCell>
                        <TableCell>
                          {session.device_name || session.device_ip_address || 'N/A'}
                          {session.device_port && ` (${session.device_port})`}
                        </TableCell>
                        <TableCell>{new Date(session.started_at).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="contained" color="error" size="small"
                            onClick={() => handleOpenDialog(operators.find(op => op.id === session.operator_id) || {id: session.operator_id, username: session.operator_username})}
                          >
                            Terminate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} align="center">No active sessions found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {tabValue === 1 && !loading && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Operator</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Started At</TableCell>
                    <TableCell>Ended At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.length > 0 ? (
                    sessions.map((session) => (
                      <TableRow key={session.id} sx={{ bgcolor: session.status === 'active' ? 'success.lightest' : (session.status === 'killed' ? 'error.lightest' : 'inherit')}}>
                        <TableCell>{session.operator_username || operators.find(op => op.id === session.operator_id)?.username || 'Unknown'}</TableCell>
                        <TableCell>
                          {session.device_name || session.device_ip_address || 'N/A'}
                          {session.device_port && ` (${session.device_port})`}
                        </TableCell>
                        <TableCell>{new Date(session.started_at).toLocaleString()}</TableCell>
                        <TableCell>{session.ended_at ? new Date(session.ended_at).toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          <Box component="span" sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: session.status === 'active' ? 'success.light' : (session.status === 'killed' ? 'error.light' : 'text.disabled'), color: 'common.white', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-block' }}>
                            {session.status}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {session.status === 'active' ? (
                            <Button variant="contained" color="error" size="small" onClick={() => handleOpenDialog(operators.find(op => op.id === session.operator_id) || {id: session.operator_id, username: session.operator_username})}>Terminate</Button>
                          ) : (
                            <Button variant="outlined" disabled size="small">{session.status === 'killed' ? 'Terminated' : 'Completed'}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} align="center">No sessions found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{mt: 2}}>Command Log History</Typography>
              <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Operator</InputLabel>
                    <Select name="operatorId" value={logFilters.operatorId} onChange={handleLogFilterChange} label="Operator">
                      <MenuItem value=""><em>All Operators</em></MenuItem>
                      {operators.map((op) => (<MenuItem key={op.id} value={op.id}>{op.username}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Device</InputLabel>
                    <Select name="deviceId" value={logFilters.deviceId} onChange={handleLogFilterChange} label="Device" disabled={logDevicesLoading}> {/* Thêm disabled khi đang load */}
                      <MenuItem value=""><em>All Devices</em></MenuItem>
                      {/* Sử dụng allLogDevicesForFilter */}
                      {allLogDevicesForFilter && allLogDevicesForFilter.length > 0 ? (
                        allLogDevicesForFilter.map((dev) => (
                          <MenuItem key={dev.id} value={dev.id}>
                            { dev.ip_address || `Device ID: ${dev.id}`} 
                            {dev.port ? ` (${dev.port})` : ' (Unknown Type)'}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          {logDevicesLoading ? <CircularProgress size={20} /> : <em>No devices with logs found</em>}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField 
                    name="filterDate" 
                    label="Filter by Date" 
                    type="date" 
                    value={logFilters.filterDate} 
                    onChange={handleLogFilterChange} 
                    InputLabelProps={{ shrink: true }} 
                    fullWidth 
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3} sx={{display: 'flex', justifyContent:'flex-end', alignItems: 'center'}}>
                    <Button onClick={fetchCommandLogs} variant="outlined" disabled={commandLogLoading}>Filter Logs</Button>
                </Grid>
              </Grid>

              {commandLogLoading && <Box display="flex" justifyContent="center" my={4}><CircularProgress /></Box>}
              {commandLogError && <Box color="error.main" mb={2}>{commandLogError}</Box>}
              
              {!commandLogLoading && !commandLogError && (
                <>
                  <TableContainer component={Paper}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          {logTableHeaders.map(headCell => (
                            <TableCell key={headCell.id} sortDirection={logSortBy === headCell.id ? logSortOrder : false}>
                              {headCell.sortable ? (
                                <TableSortLabel
                                  active={logSortBy === headCell.id}
                                  direction={logSortBy === headCell.id ? logSortOrder : 'asc'}
                                  onClick={() => handleLogSortRequest(headCell.id)}
                                >
                                  {headCell.label}
                                </TableSortLabel>
                              ) : (
                                headCell.label
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {commandLogs.length > 0 ? (
                          commandLogs.map((log) => (
                            <TableRow hover key={log.id}>
                              <TableCell>{log.operator_username}</TableCell>
                              <TableCell>
                                {log.device_name || log.device_ip_address || 'Unknown'}
                                {log.device_port && ` (${log.device_port})`}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Tooltip title={<pre style={{whiteSpace: 'pre-wrap', margin:0, maxWidth: 400}}>{log.command}</pre>} placement="top-start"><Box component="span">{log.command}</Box></Tooltip>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Tooltip title={<pre style={{whiteSpace: 'pre-wrap', margin:0, maxWidth: 400}}>{log.result}</pre>} placement="top-start"><Box component="span">{log.result}</Box></Tooltip>
                              </TableCell>
                              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={logTableHeaders.length} align="center">No command logs found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50, 100]}
                    component="div"
                    count={commandLogsTotal}
                    rowsPerPage={logRowsPerPage}
                    page={logPage}
                    onPageChange={handleLogPageChange}
                    onRowsPerPageChange={handleLogRowsPerPageChange}
                  />
                </>
              )}
            </Box>
          )}
          
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Session Termination</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to terminate active sessions for {selectedOperator?.username}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleTerminateSession} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Terminate All Sessions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionHistoryView;