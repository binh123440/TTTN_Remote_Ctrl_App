import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material'
import axios from 'axios'

function TabPanel (props) {
  const { children, value, index, ...other } = props
  return (
    <div role='tabpanel' hidden={value !== index} id={`device-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const DeviceManagement = () => {
  const [tabValue, setTabValue] = useState(0)
  const [deviceGroups, setDeviceGroups] = useState([])
  const [hotspotResults, setHotspotResults] = useState([])
  // Add this with your other state declarations (around line 30)
  const [dockerResults, setDockerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = localStorage.getItem('accessToken')

  // Form fields for creating a device
  const [deviceData, setDeviceData] = useState({
    ip_address: '',
    port: '22',
    connection_type: 'SSH',
    username: '',
    password: '',
    device_type: 'Router',
    location: '',
    controlled_feature: '',
    private_key: '',
    device_group_id: ''
  })

  // Device group form fields
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')

  // Add this state and function
  const [linuxContainers, setLinuxContainers] = useState([])

  // Add state to track active scan type
  const [activeScanType, setActiveScanType] = useState('hotspot'); // 'hotspot' or 'docker'

  const scanDockerLinux = async () => {
    console.log('Scanning Docker Linux VMs...')
    try {
      setLoading(true)
      setActiveScanType('docker');
      const response = await axios.get('http://localhost:8000/docker-linux', {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('Docker Linux scan response:', response.data)
      setDockerResults(response.data) // Using the same state for display
    } catch (err) {
      console.error('Docker Linux scan error:', err)
      setError(`Failed to scan Docker Linux VMs: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceGroups()
  }, [])

  const fetchDeviceGroups = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:8000/device-groups/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeviceGroups(response.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch device groups')
      console.error('Error fetching device groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setDeviceData({ ...deviceData, [name]: value })
  }

  const handleConnectionTypeChange = e => {
    const connectionType = e.target.value
    let suggestedPort = deviceData.port

    // Suggest default ports based on connection type
    switch (connectionType) {
      case 'SSH':
        suggestedPort = '22'
        break
      case 'TELNET':
        suggestedPort = '23'
        break
      case 'HTTP':
        suggestedPort = '80'
        break
      default:
        suggestedPort = '22'
    }

    setDeviceData({
      ...deviceData,
      connection_type: connectionType,
      port: suggestedPort
    })
  }

  // Modify scanHotspot function to set active scan type
  const scanHotspot = async () => {
    try {
      setLoading(true);
      setActiveScanType('hotspot');
      const response = await axios.get('http://localhost:8000/hotspot', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotspotResults(response.data);
    } catch (err) {
      setError('Failed to scan devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectDevice = device => {
    // Special handling for Docker Linux VMs
    if (device.ssh_port) {
      // This is a Docker Linux VM with SSH port mapping
      setDeviceData({
        ...deviceData,
        ip_address: device.ip,
        port: device.ssh_port,
        username: device.default_username || 'root',
        password: device.default_password || 'password',
        connection_type: 'SSH',
        device_type: 'Docker Linux VM',
        controlled_feature: device.container_name,
        location: 'Docker'
      })
    } else if (device.direct_ssh) {
      // Docker container with direct SSH access
      setDeviceData({
        ...deviceData,
        ip_address: device.ip,
        port: '22',
        username: 'root',
        password: 'password',
        connection_type: 'SSH',
        device_type: 'Docker Linux VM',
        controlled_feature: device.container_name,
        location: 'Docker'
      })
    } else if (device.host_mappings && device.host_mappings.length > 0) {
      // Regular container with host mappings
      const [host, port] = device.host_mappings[0].split(':')
      setDeviceData({
        ...deviceData,
        ip_address: host === 'localhost' ? '127.0.0.1' : host,
        port: port,
        username: 'root',
        password: 'password'
      })
    } else {
      // Regular device
      setDeviceData({
        ...deviceData,
        ip_address: device.ip,
        port: device.open_ports && device.open_ports.length > 0 ? device.open_ports[0].toString() : '22'
      })
    }
    setTabValue(0) // Switch to the Create Device tab
  }

  const handleCreateDevice = async e => {
    e.preventDefault()

    try {
      setLoading(true)
      await axios.post('http://localhost:8000/devices/', deviceData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Reset form
      setDeviceData({
        ip_address: '',
        port: '22',
        connection_type: 'SSH',
        username: '',
        password: '',
        device_type: 'Router',
        location: '',
        controlled_feature: '',
        private_key: '',
        device_group_id: ''
      })

      setError('')
      alert('Device created successfully')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create device')
    } finally {
      setLoading(false)
    }
  }

  // Device Group functions
  const handleCreateGroup = async e => {
    e.preventDefault()

    if (!groupName) {
      setError('Group name is required')
      return
    }

    try {
      setLoading(true)
      await axios.post(
        'http://localhost:8000/device-groups/',
        {
          group_name: groupName,
          description: description
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setGroupName('')
      setDescription('')
      fetchDeviceGroups()
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create device group')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async id => {
    try {
      setLoading(true)
      await axios.delete(`http://localhost:8000/device-groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchDeviceGroups()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete device group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label='Create Device' />
          <Tab label='Device Groups' />
          <Tab label='Scan Device' />
        </Tabs>
      </Box>

      {/* Create Device Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader title='Create New Device' />
          <Divider />
          <CardContent>
            <Box component='form' onSubmit={handleCreateDevice}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='IP Address'
                    name='ip_address'
                    value={deviceData.ip_address}
                    onChange={handleInputChange}
                    required
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Port'
                    name='port'
                    value={deviceData.port}
                    onChange={handleInputChange}
                    required
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin='normal'>
                    <InputLabel>Connection Type</InputLabel>
                    <Select name='connection_type' value={deviceData.connection_type} onChange={handleConnectionTypeChange} required>
                      <MenuItem value='SSH'>SSH</MenuItem>
                      <MenuItem value='TELNET'>Telnet</MenuItem>
                      <MenuItem value='HTTP'>HTTP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Username'
                    name='username'
                    value={deviceData.username}
                    onChange={handleInputChange}
                    required
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Password'
                    name='password'
                    type='password'
                    value={deviceData.password}
                    onChange={handleInputChange}
                    required
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Device Type'
                    name='device_type'
                    value={deviceData.device_type}
                    onChange={handleInputChange}
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Location'
                    name='location'
                    value={deviceData.location}
                    onChange={handleInputChange}
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Controlled Feature'
                    name='controlled_feature'
                    value={deviceData.controlled_feature}
                    onChange={handleInputChange}
                    required
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Private Key'
                    name='private_key'
                    value={deviceData.private_key}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    margin='normal'
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin='normal' required>
                    <InputLabel>Device Group</InputLabel>
                    <Select name='device_group_id' value={deviceData.device_group_id} onChange={handleInputChange}>
                      {deviceGroups.map(group => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.group_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {error && (
                <Box color='error.main' mt={2}>
                  {error}
                </Box>
              )}
              <Box mt={3}>
                <Button color='primary' variant='contained' type='submit' disabled={loading}>
                  {loading ? 'Creating...' : 'Create Device'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Device Groups Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardHeader title='Create Device Group' />
              <Divider />
              <CardContent>
                <Box component='form' onSubmit={handleCreateGroup}>
                  <TextField
                    fullWidth
                    label='Group Name'
                    margin='normal'
                    name='groupName'
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label='Description'
                    margin='normal'
                    name='description'
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    multiline
                    rows={3}
                  />
                  {error && (
                    <Box color='error.main' mt={2}>
                      {error}
                    </Box>
                  )}
                  <Box mt={2}>
                    <Button color='primary' variant='contained' type='submit' disabled={loading}>
                      {loading ? 'Creating...' : 'Create Device Group'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card>
              <CardHeader title='Device Groups' />
              <Divider />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Group Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align='right'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deviceGroups.map(group => (
                        <TableRow key={group.id}>
                          <TableCell>{group.id}</TableCell>
                          <TableCell>{group.group_name}</TableCell>
                          <TableCell>{group.description}</TableCell>
                          <TableCell align='right'>
                            <Button color='error' size='small' variant='outlined' onClick={() => handleDeleteGroup(group.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Scan Device Tab (formerly Hotspot Devices) */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardHeader
            title="Scan Device"
            action={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={scanHotspot} 
                  disabled={loading}
                  color={activeScanType === 'hotspot' ? 'primary' : 'inherit'}
                >
                  Scan Network Devices
                </Button>
                <Button 
                  variant="contained" 
                  onClick={scanDockerLinux} 
                  disabled={loading} 
                  sx={{ ml: 2 }} 
                  color={activeScanType === 'docker' ? 'secondary' : 'inherit'}
                >
                  Scan Docker Linux VMs
                </Button>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Display scan type heading */}
                <Typography variant="h6" mb={2}>
                  {activeScanType === 'hotspot' ? 'Network Devices' : 'Docker Linux VMs'}
                </Typography>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {activeScanType === 'hotspot' ? (
                          // Hotspot results header
                          <>
                            <TableCell>MAC Address</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Hostname</TableCell>
                            <TableCell>Open Ports</TableCell>
                          </>
                        ) : (
                          // Docker results header
                          <>
                            <TableCell>Container Name</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Image</TableCell>
                            <TableCell>SSH Access</TableCell>
                          </>
                        )}
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeScanType === 'hotspot' ? (
                        // Hotspot results
                        hotspotResults.length > 0 ? (
                          hotspotResults.map((device, index) => (
                            <TableRow key={index}>
                              <TableCell>{device.mac}</TableCell>
                              <TableCell>{device.ip}</TableCell>
                              <TableCell>{device.hostname || 'Unknown'}</TableCell>
                              <TableCell>
                                {device.open_ports && device.open_ports.length > 0 ? device.open_ports.join(', ') : 'None detected'}
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  onClick={() => selectDevice(device)}
                                  size="small"
                                  variant="outlined"
                                >
                                  + Select
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No network devices found. Start a scan.
                            </TableCell>
                          </TableRow>
                        )
                      ) : (
                        // Docker results
                        dockerResults.length > 0 ? (
                          dockerResults.map((device, index) => (
                            <TableRow key={index}>
                              <TableCell>{device.container_name || 'Unknown'}</TableCell>
                              <TableCell>{device.ip}</TableCell>
                              <TableCell>{device.image || 'Unknown'}</TableCell>
                              <TableCell>
                                {device.ssh_port ? `Port: ${device.ssh_port}` : 
                                 device.direct_ssh ? device.direct_ssh : 
                                 'None detected'}
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  onClick={() => selectDevice(device)}
                                  size="small"
                                  variant="outlined"
                                >
                                  + Select
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No Docker Linux VMs found. Start a scan.
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  )
}

export default DeviceManagement
