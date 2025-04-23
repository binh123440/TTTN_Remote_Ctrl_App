import PropTypes from 'prop-types'
import React from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'

import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid2'
import Link from '@mui/material/Link'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import OutlinedInput from '@mui/material/OutlinedInput'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'

import * as Yup from 'yup'
import { Formik } from 'formik'

import IconButton from 'components/@extended/IconButton'
import AnimateButton from 'components/@extended/AnimateButton'

import EyeOutlined from '@ant-design/icons/EyeOutlined'
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined'

const API_BASE_URL = 'http://localhost:8000'

export default function AuthLogin({ isDemo = false }) {
  const navigate = useNavigate()
  const [checked, setChecked] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [loginError, setLoginError] = React.useState('')

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }

  // Thêm sự kiện để gọi API Reset Admin Password
  const handleResetAdminPassword = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/reset-admin-password`)
      alert(response.data.message || 'Đã reset mật khẩu thành công!')
    } catch (error) {
      console.error('Lỗi reset mật khẩu:', error)
      alert(error.response?.data?.detail || 'Không thể reset mật khẩu.')
    }
  }

  // Xử lý đăng nhập khi nhấn Enter
  const handleKeyDown = (event, handleSubmit) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()  // Gọi hàm handleSubmit để gửi form khi bấm Enter
    }
  }

  return (
    <Formik
      initialValues={{
        username: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        username: Yup.string()
          .max(255)
          .required('Username is required'),
        password: Yup.string()
          .required('Password is required')
          .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', value => value === value.trim())
          .max(20, 'Password must be less than 20 characters')
      })}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          setLoginError('')
          const formData = new URLSearchParams()
          formData.append('username', values.username)
          formData.append('password', values.password)

          const response = await axios.post(`${API_BASE_URL}/token`, formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })

          if (response.data && response.data.access_token) {
            const { access_token, token_type } = response.data
            localStorage.setItem('accessToken', access_token)
            localStorage.setItem('tokenType', token_type)

            if (checked) {
              localStorage.setItem('username', values.username)
            }

            window.location.href = '/'
          } else {
            throw new Error('Invalid response format: missing access token')
          }
        } catch (error) {
          console.error('Login error details:', error)
          if (error.response) {
            if (error.response.status === 400 || error.response.status === 401) {
              setLoginError('Invalid username or password')
            } else {
              setLoginError(error.response.data?.detail || 'Login failed. Please try again.')
            }
          } else if (error.request) {
            setLoginError('No response from server. Please try again later.')
          } else {
            setLoginError('Error during login: ' + error.message)
          }
          setSubmitting(false)
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {loginError && (
              <Grid size={12}>
                <Alert severity='error'>{loginError}</Alert>
              </Grid>
            )}

            <Grid size={12}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor='username-login'>Username</InputLabel>
                <OutlinedInput
                  id='username-login'
                  type='text'
                  value={values.username}
                  name='username'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder='Enter username'
                  fullWidth
                  error={Boolean(touched.username && errors.username)}
                  onKeyDown={(event) => handleKeyDown(event, handleSubmit)}  // Gọi hàm handleSubmit khi bấm Enter
                />
              </Stack>
              {touched.username && errors.username && (
                <FormHelperText error id='standard-weight-helper-text-username-login'>
                  {errors.username}
                </FormHelperText>
              )}
            </Grid>

            <Grid size={12}>
              <Stack sx={{ gap: 1 }}>
                <InputLabel htmlFor='password-login'>Password</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.password && errors.password)}
                  id='password-login'
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  name='password'
                  onBlur={handleBlur}
                  onChange={handleChange}
                  endAdornment={
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label='toggle password visibility'
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge='end'
                        color='secondary'
                      >
                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  }
                  placeholder='Enter password'
                  onKeyDown={(event) => handleKeyDown(event, handleSubmit)}  // Gọi hàm handleSubmit khi bấm Enter
                />
              </Stack>
              {touched.password && errors.password && (
                <FormHelperText error id='standard-weight-helper-text-password-login'>
                  {errors.password}
                </FormHelperText>
              )}
            </Grid>

            <Grid sx={{ mt: -1 }} size={12}>
              <Stack direction='row' sx={{ gap: 2, alignItems: 'baseline', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={event => setChecked(event.target.checked)}
                      name='checked'
                      color='primary'
                      size='small'
                    />
                  }
                  label={<Typography variant='h6'>Keep me sign in</Typography>}
                />
                <Stack direction='column' spacing={1} alignItems='flex-end'>
                  <Link variant='h6' component={RouterLink} to='#' color='text.primary'>
                    Forgot Password?
                  </Link>
                  <Link
                    variant='h6'
                    component='button'
                    onClick={handleResetAdminPassword}  // Gọi sự kiện khi bấm
                    color='error.main'
                    underline='hover'
                  >
                    Reset Admin Password
                  </Link>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={12}>
              <AnimateButton>
                <Button fullWidth size='large' type='submit' variant='contained' color='primary' disabled={isSubmitting}>
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  )
}

AuthLogin.propTypes = { isDemo: PropTypes.bool }
