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
  Alert
} from '@mui/material';
import MainCard from 'components/MainCard';
import axios from 'axios';

const token = localStorage.getItem('accessToken');

const AssignProfile = () => {
  const [profiles, setProfiles] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
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

  const handleAssign = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:8000/assign-profile/',
        {
          profile_id: selectedProfile,
          operator_id: selectedOperator
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setAssignedData(response.data.assigned_profile); // Lưu thông tin profile đã gán
      setSuccess(true);
      setSelectedProfile('');
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

  return (
    <MainCard title={<Typography variant="h5">Gán Profile Cho Operator</Typography>}>
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

      <Box display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={handleAssign} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Gán Profile'}
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Gán profile thành công!
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
        <Box mt={3} textAlign="center">
          <Typography variant="h6">Thông tin gán profile:</Typography>
          <Typography>Profile: {assignedData.profile_name}</Typography>
          <Typography>Operator: {assignedData.operator_name}</Typography>
        </Box>
      )}
    </MainCard>
  );
};

export default AssignProfile;
