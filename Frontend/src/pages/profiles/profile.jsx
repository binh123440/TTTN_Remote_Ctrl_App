// src/components/CreateProfile.jsx
import { useEffect, useState } from "react";
import MainCard from 'components/MainCard';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {
  Button,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";


// Token lấy từ localStorage nếu có login
const token = localStorage.getItem('accessToken');

export default function Profile() {
  const navigate = useNavigate(); // ✅ Lấy navigate
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/profiles/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfiles(response.data);
      } catch (error) {
        console.error("Lỗi khi load profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <MainCard
      title={
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            Lists Profile
          </Typography>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={() => navigate('/create-profile')}>
              Tạo Profile
            </Button>
            <Button variant="contained" color="primary" onClick={() => navigate('/assign-profile')}>
              Gán Profile
            </Button>
          </Box>
          
        </Box>
      }
    >
      <Box p={3}>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Command List</TableCell>
                <TableCell>Device Group</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.id}</TableCell>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>{profile.command_name}</TableCell>
                  <TableCell>{profile.device_group_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>

    </MainCard>
    
  );
}
