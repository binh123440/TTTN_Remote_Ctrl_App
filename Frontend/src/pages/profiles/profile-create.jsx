// src/components/CreateProfile.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import MainCard from 'components/MainCard';
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box,
  Typography,
} from "@mui/material";

// Token nên lấy từ localStorage nếu có login
const token = localStorage.getItem('accessToken');

export default function CreateProfile() {
  const [name, setName] = useState("");
  const [commandListId, setCommandListId] = useState("");
  const [deviceGroupId, setDeviceGroupId] = useState("");
  const [commandLists, setCommandLists] = useState([]);
  const [deviceGroups, setDeviceGroups] = useState([]);

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/profiles/",
        {
          name,
          command_list_id: commandListId,
          device_group_id: deviceGroupId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Profile created:", response.data);
      alert("Tạo Profile thành công!");
      setName("");
      setCommandListId("");
      setDeviceGroupId("");
    } catch (error) {
      console.error("Lỗi khi tạo profile:", error);
      alert("Tạo Profile thất bại!");
    }
  };

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/command-lists/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setCommandLists(res.data);
      })
      .catch((err) => {
        console.error("Lỗi lấy command lists:", err);
      });

    axios
      .get("http://127.0.0.1:8000/device-groups/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setDeviceGroups(res.data); // ✅ Đã sửa đúng ở đây
      })
      .catch((err) => {
        console.error("Lỗi lấy device groups:", err);
      });
  }, []);

  return (
    <MainCard
      title={
        <Typography variant="h5" fontWeight="bold">
          Create Profile
        </Typography>
      }
    >
      <Typography variant="h6" mb={2}>
        Tạo Profile Mới
      </Typography>

      <TextField
        label="Tên profile"
        fullWidth
        margin="normal"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Chọn command list</InputLabel>
        <Select
          value={commandListId}
          label="Chọn command list"
          onChange={(e) => setCommandListId(e.target.value)}
        >
          {commandLists.map((cmd) => (
            <MenuItem key={cmd.id} value={cmd.id}>
              {cmd.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel>Chọn device group</InputLabel>
        <Select
          value={deviceGroupId}
          label="Chọn device group"
          onChange={(e) => setDeviceGroupId(e.target.value)}
        >
          {deviceGroups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.group_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Tạo Profile
        </Button>
      </Box>
    </MainCard>
  );
}
