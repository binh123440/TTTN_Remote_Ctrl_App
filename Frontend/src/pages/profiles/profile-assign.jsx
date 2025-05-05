import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  IconButton
} from '@mui/material';
import MainCard from 'components/MainCard';
import axios from 'axios';

const token = localStorage.getItem('accessToken');

const AssignProfile = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profiles, setProfiles] = useState([]);
  const [operators, setOperators] = useState([]);
  
  // For tab 1: Multiple profiles to one operator
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  
  // For tab 2: Multiple operators to one profile
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedOperators, setSelectedOperators] = useState([]);
  
  // For tab 3: Unassignment
  const [viewOperator, setViewOperator] = useState('');
  const [operatorProfiles, setOperatorProfiles] = useState([]);
  const [selectedProfilesToUnassign, setSelectedProfilesToUnassign] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [assignedData, setAssignedData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, userRes] = await Promise.all([
          axios.get('http://localhost:8000/profiles/', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/users/', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setProfiles(profileRes.data);
        const operatorsOnly = userRes.data.users.filter(user => user.role === 'operator');
        setOperators(operatorsOnly);
      } catch (error) {
        setErrorMsg('Lỗi khi tải dữ liệu');
      }
    };

    fetchData();
  }, []);

  // Fetch profiles for a specific operator when selected in unassign tab
  useEffect(() => {
    if (viewOperator && tabValue === 2) {
      fetchOperatorProfiles(viewOperator);
    } else {
      setOperatorProfiles([]);
    }
  }, [viewOperator]);

  const fetchOperatorProfiles = async (operatorId) => {
    try {
      const response = await axios.get(`http://localhost:8000/user-profiles/operator/${operatorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOperatorProfiles(response.data || []);
    } catch (error) {
      setErrorMsg(`Lỗi khi tải profile cho operator`);
      setOperatorProfiles([]);
    }
  };

  const handleAssignProfilesToOperator = async () => {
    if (selectedProfiles.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một profile');
      return;
    }
    
    if (!selectedOperator) {
      setErrorMsg('Vui lòng chọn một operator');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/assign-profile/',
        {
          profile_ids: selectedProfiles,
          operator_id: selectedOperator
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAssignedData({
        operator_name: operators.find(op => op.id === selectedOperator)?.username,
        profile_count: selectedProfiles.length,
        profiles: selectedProfiles.map(id => profiles.find(p => p.id === id)?.name)
      });
      setSuccess(true);
      setSelectedProfiles([]);
      setSelectedOperator('');

    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map((e) => e.msg).join(', '));
      } else if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Gán profile thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOperatorsToProfile = async () => {
    if (selectedOperators.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một operator');
      return;
    }
    
    if (!selectedProfile) {
      setErrorMsg('Vui lòng chọn một profile');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/assign-profile/',
        {
          profile_id: selectedProfile,
          operator_ids: selectedOperators
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAssignedData({
        profile_name: profiles.find(p => p.id === selectedProfile)?.name,
        operator_count: selectedOperators.length,
        operators: selectedOperators.map(id => operators.find(op => op.id === id)?.username)
      });
      setSuccess(true);
      setSelectedOperators([]);
      setSelectedProfile('');

    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map((e) => e.msg).join(', '));
      } else if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Gán profile thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignProfiles = async () => {
    if (selectedProfilesToUnassign.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một profile để gỡ');
      return;
    }
    
    if (!viewOperator) {
      setErrorMsg('Vui lòng chọn một operator');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete(
        'http://localhost:8000/unassign-profile/',
        {
          data: {
            profile_ids: selectedProfilesToUnassign,
            operator_id: viewOperator
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(true);
      setAssignedData({
        operator_name: operators.find(op => op.id === viewOperator)?.username,
        profile_count: selectedProfilesToUnassign.length,
        profiles: selectedProfilesToUnassign.map(id => 
          operatorProfiles.find(p => p.profile_id === id)?.profile_name || `Profile ID: ${id}`
        )
      });
      
      // Refresh the list
      fetchOperatorProfiles(viewOperator);
      setSelectedProfilesToUnassign([]);
      
    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setErrorMsg(detail.map((e) => e.msg).join(', '));
      } else if (typeof detail === 'string') {
        setErrorMsg(detail);
      } else {
        setErrorMsg('Gỡ profile thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  return (
    <MainCard title={<Typography variant="h5">Quản Lý Gán Profile</Typography>}>
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Gán Nhiều Profile" />
        <Tab label="Gán Nhiều Operator" />
        <Tab label="Gỡ Bỏ Profile" />
      </Tabs>

      {tabValue === 0 && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn Operator</InputLabel>
            <Select
              value={selectedOperator}
              label="Chọn Operator"
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              {operators.map((operator) => (
                <MenuItem key={operator.id} value={operator.id}>
                  {operator.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn Nhiều Profile</InputLabel>
            <Select
              multiple
              value={selectedProfiles}
              onChange={(e) => setSelectedProfiles(e.target.value)}
              input={<OutlinedInput label="Chọn Nhiều Profile" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={profiles.find(profile => profile.id === value)?.name} 
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {profiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  <Checkbox checked={selectedProfiles.indexOf(profile.id) > -1} />
                  <ListItemText primary={profile.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="center" mt={3}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAssignProfilesToOperator} 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Gán Profiles Cho Operator'}
            </Button>
          </Box>
        </>
      )}

      {tabValue === 1 && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn Profile</InputLabel>
            <Select
              value={selectedProfile}
              label="Chọn Profile"
              onChange={(e) => setSelectedProfile(e.target.value)}
            >
              {profiles.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn Nhiều Operator</InputLabel>
            <Select
              multiple
              value={selectedOperators}
              onChange={(e) => setSelectedOperators(e.target.value)}
              input={<OutlinedInput label="Chọn Nhiều Operator" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={operators.find(operator => operator.id === value)?.username} 
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {operators.map((operator) => (
                <MenuItem key={operator.id} value={operator.id}>
                  <Checkbox checked={selectedOperators.indexOf(operator.id) > -1} />
                  <ListItemText primary={operator.username} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box display="flex" justifyContent="center" mt={3}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAssignOperatorsToProfile} 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Gán Operators Cho Profile'}
            </Button>
          </Box>
        </>
      )}

      {tabValue === 2 && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Gỡ bỏ gán profile cho operator
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Chọn Operator</InputLabel>
            <Select
              value={viewOperator}
              label="Chọn Operator"
              onChange={(e) => setViewOperator(e.target.value)}
            >
              {operators.map((operator) => (
                <MenuItem key={operator.id} value={operator.id}>
                  {operator.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {viewOperator && operatorProfiles.length > 0 ? (
            <>
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Profile đã gán cho operator
                </Typography>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Chọn Profiles để Gỡ</InputLabel>
                  <Select
                    multiple
                    value={selectedProfilesToUnassign}
                    onChange={(e) => setSelectedProfilesToUnassign(e.target.value)}
                    input={<OutlinedInput label="Chọn Profiles để Gỡ" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const profileName = operatorProfiles.find(p => p.profile_id === value)?.profile_name;
                          return <Chip key={value} label={profileName} />;
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {operatorProfiles.map((item) => (
                      <MenuItem key={item.profile_id} value={item.profile_id}>
                        <Checkbox checked={selectedProfilesToUnassign.indexOf(item.profile_id) > -1} />
                        <ListItemText primary={item.profile_name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box display="flex" justifyContent="center" mt={3}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleUnassignProfiles}
                    disabled={loading || selectedProfilesToUnassign.length === 0}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Gỡ Bỏ Profile Đã Chọn'}
                  </Button>
                </Box>
              </Box>
            </>
          ) : viewOperator ? (
            <Typography sx={{ mt: 3, textAlign: 'center' }} color="text.secondary">
              Không có profile nào được gán cho operator này.
            </Typography>
          ) : null}
        </>
      )}

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {tabValue === 2 ? 'Gỡ profile thành công!' : 'Gán profile thành công!'}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMsg}
        autoHideDuration={4000}
        onClose={() => setErrorMsg('')}
      >
        <Alert onClose={() => setErrorMsg('')} severity="error" sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>

      {assignedData && (
        <Box mt={3} p={2} border={1} borderColor="divider" borderRadius={1}>
          <Typography variant="h6" gutterBottom>
            {tabValue === 2 ? 'Thông tin gỡ bỏ profile:' : 'Thông tin gán profile:'}
          </Typography>
          
          {assignedData.operator_name && assignedData.profiles && (
            <>
              <Typography>Operator: {assignedData.operator_name}</Typography>
              <Typography>Số lượng profile: {assignedData.profile_count}</Typography>
              <Typography>Profiles: {assignedData.profiles.join(', ')}</Typography>
            </>
          )}
          
          {assignedData.profile_name && assignedData.operators && (
            <>
              <Typography>Profile: {assignedData.profile_name}</Typography>
              <Typography>Số lượng operator: {assignedData.operator_count}</Typography>
              <Typography>Operators: {assignedData.operators.join(', ')}</Typography>
            </>
          )}
        </Box>
      )}
    </MainCard>
  );
};

export default AssignProfile;
