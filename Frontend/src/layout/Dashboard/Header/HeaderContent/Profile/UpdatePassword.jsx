import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';

const UpdatePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setSnackbar({ open: true, message: 'Mật khẩu mới không khớp!', severity: 'error' });
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');

            await axios.put(
                'http://localhost:8000/users/update-password',
                {
                    old_password: formData.currentPassword,
                    new_password: formData.newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSnackbar({ open: true, message: 'Cập nhật mật khẩu thành công! Đang đăng xuất...', severity: 'success' });

            setTimeout(() => {
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            }, 1500);

            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.detail || 'Đã xảy ra lỗi khi cập nhật mật khẩu';
            setSnackbar({
                open: true,
                message: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
                severity: 'error'
            });
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>Update Password</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Update Password
                </Button>
            </form>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UpdatePassword;
