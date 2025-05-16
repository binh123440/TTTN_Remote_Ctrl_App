import { useState, useEffect } from 'react'
import axios from 'axios'

// material-ui
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Chip
} from '@mui/material'

// icons
import { DeleteOutlined, EditOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'

// project imports
import MainCard from 'components/MainCard'
import { API_BASE_URL } from 'config'

// ==============================|| ADMIN - USER MANAGEMENT ||============================== //

export default function UserManagement () {
  const [activeTab, setActiveTab] = useState(0)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    role: ''
  })
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})

  // Pagination states
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Fetch users when the component mounts
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`${API_BASE_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setUsers(response.data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
      setNotification({
        open: true,
        message: 'Failed to load users',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      })
    }
  }

  const validate = () => {
    const newErrors = {}

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required'
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    // Phone validation
    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required'
    }

    // Password validation - only for new users
    if (!editingUser) {
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post(`${API_BASE_URL}/create-user/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Reset form after successful submission
      setFormData({
        username: '',
        email: '',
        phone_number: '',
        password: '',
        role: ''
      })

      setNotification({
        open: true,
        message: `User created successfully with ID: ${response.data.user_id}`,
        severity: 'success'
      })

      // Refresh the user list
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)

      let errorMessage = 'Failed to create user'
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }

      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = user => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number || '',
      password: '', // Leave password blank when editing
      role: user.role
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async e => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create a data object that only includes fields that are not empty
      const updateData = {}
      if (formData.username) updateData.username = formData.username
      if (formData.email) updateData.email = formData.email
      if (formData.phone_number) updateData.phone_number = formData.phone_number
      if (formData.role) updateData.role = formData.role
      if (formData.password) updateData.password = formData.password

      const token = localStorage.getItem('accessToken')
      await axios.put(`${API_BASE_URL}/users/${editingUser.id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setNotification({
        open: true,
        message: `User updated successfully`,
        severity: 'success'
      })

      setEditDialogOpen(false)
      fetchUsers() // Refresh user list
    } catch (error) {
      console.error('Error updating user:', error)

      // Log the complete error object for debugging
      console.log('Full error object:', JSON.stringify(error, null, 2))

      let errorMessage = 'Failed to update user'
      let fieldErrors = {}

      // Try to access error information directly from Axios
      if (error.response) {
        console.log('Error status:', error.response.status)
        console.log('Error headers:', error.response.headers)
        console.log('Error data:', error.response.data)

        // Try to extract SQLAlchemy error details
        if (error.response.data) {
          if (typeof error.response.data === 'string' && error.response.data.includes('phone_number')) {
            errorMessage = 'This phone number is already in use by another user'
            fieldErrors.phone_number = 'Phone number already in use'
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail

            // Special handling for unique constraint violations
            if (
              typeof errorMessage === 'string' &&
              (errorMessage.includes('UniqueViolation') ||
                errorMessage.includes('IntegrityError') ||
                errorMessage.includes('violates unique constraint'))
            ) {
              if (errorMessage.includes('phone_number')) {
                errorMessage = 'This phone number is already in use by another user'
                fieldErrors.phone_number = 'Phone number already in use'
              } else if (errorMessage.includes('email')) {
                errorMessage = 'This email is already in use'
                fieldErrors.email = 'Email already in use'
              } else if (errorMessage.includes('username')) {
                errorMessage = 'This username is already in use'
                fieldErrors.username = 'Username already in use'
              }
            }
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received:', error.request)
        errorMessage = 'No response from server. Please try again later.'
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error message:', error.message)
        errorMessage = `Error during request: ${error.message}`
      }

      // Update any field-specific errors
      setErrors({
        ...errors,
        ...fieldErrors
      })

      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = user => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.delete(`${API_BASE_URL}/users/${userToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setNotification({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      })

      fetchUsers() // Refresh user list
    } catch (error) {
      console.error('Error deleting user:', error)

      let errorMessage = 'Failed to delete user'
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }

      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      })
    } finally {
      setDeleteConfirmOpen(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    })
  }

  const getRoleChipColor = role => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'supervisor':
        return 'warning'
      case 'team_lead':
        return 'info'
      case 'operator':
        return 'success'
      default:
        return 'default'
    }
  }

  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant='h5'>User Management</Typography>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='user management tabs'>
            <Tab label='User List' />
            <Tab label='Create User' />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <MainCard title='User List'>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label='user table'>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align='right'>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number || '-'}</TableCell>
                        <TableCell>
                          <Chip label={user.role} color={getRoleChipColor(user.role)} size='small' />
                        </TableCell>
                        <TableCell align='right'>
                          <IconButton color='primary' onClick={() => handleEditClick(user)} size='small'>
                            <EditOutlined />
                          </IconButton>
                          <IconButton color='error' onClick={() => handleDeleteClick(user)} size='small'>
                            <DeleteOutlined />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                count={users.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </MainCard>
        )}

        {activeTab === 1 && (
          <MainCard title='Create New User'>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Username'
                    name='username'
                    value={formData.username}
                    onChange={handleChange}
                    error={Boolean(errors.username)}
                    helperText={errors.username}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Phone Number'
                    name='phone_number'
                    value={formData.phone_number}
                    onChange={handleChange}
                    error={Boolean(errors.phone_number)}
                    helperText={errors.phone_number}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Password'
                    name='password'
                    type='password'
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(errors.password)}
                    helperText={errors.password}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth error={Boolean(errors.role)}>
                    <InputLabel>Role</InputLabel>
                    <Select name='role' value={formData.role} label='Role' onChange={handleChange}>
                      <MenuItem value='operator'>Operator</MenuItem>
                      <MenuItem value='team_lead'>Team Lead</MenuItem>
                      <MenuItem value='supervisor'>Supervisor</MenuItem>
                      <MenuItem value='admin'>Admin</MenuItem>
                    </Select>
                    {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction='row' justifyContent='flex-end'>
                    <Button type='submit' variant='contained' color='primary' disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create User'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </MainCard>
        )}
      </Grid>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Username'
                name='username'
                value={formData.username}
                onChange={handleChange}
                error={Boolean(errors.username)}
                helperText={errors.username}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleChange}
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Phone Number'
                name='phone_number'
                value={formData.phone_number}
                onChange={handleChange}
                error={Boolean(errors.phone_number)}
                helperText={errors.phone_number}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Password (leave blank to keep current)'
                name='password'
                type='password'
                value={formData.password}
                onChange={handleChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={Boolean(errors.role)}>
                <InputLabel>Role</InputLabel>
                <Select name='role' value={formData.role} label='Role' onChange={handleChange}>
                  <MenuItem value='operator'>Operator</MenuItem>
                  <MenuItem value='team_lead'>Team Lead</MenuItem>
                  <MenuItem value='supervisor'>Supervisor</MenuItem>
                  <MenuItem value='admin'>Admin</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} color='primary' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to delete the user: {userToDelete?.username}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color='primary'>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Changed to center for better visibility
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant='filled' // Changed from standard to filled for more prominence
          sx={{
            width: '100%',
            boxShadow: notification.severity === 'error' ? '0px 0px 10px rgba(239, 83, 80, 0.5)' : 'none',
            fontSize: notification.severity === 'error' ? '1rem' : 'inherit',
            fontWeight: notification.severity === 'error' ? 'bold' : 'normal',
            '& .MuiAlert-icon': {
              fontSize: notification.severity === 'error' ? '1.5rem' : 'inherit'
            },
            borderLeft: notification.severity === 'error' ? '5px solid #d32f2f' : 'none'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}
