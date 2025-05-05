import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import axios from 'axios'

// material-ui
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

// third-party
import * as Yup from 'yup'
import { Formik } from 'formik'

// project imports
import IconButton from 'components/@extended/IconButton'
import AnimateButton from 'components/@extended/AnimateButton'

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined'
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined'

// API URL configuration
const API_BASE_URL = 'http://localhost:8000' // Adjust to your backend URL

import { useAuth } from '../../contexts/AuthContext'

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin ({ isDemo = false, setShowForgotPassword }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [checked, setChecked] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [loginError, setLoginError] = useState('')

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }
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
      if (event.target.name === 'username' || event.target.name === 'password') {
        handleSubmit() // Thực hiện đăng nhập khi nhấn Enter
      }
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
        username: Yup.string() // username validation
          .max(255)
          .required('Username is required'),
        password: Yup.string()
          .required('Password is required')
          .test('no-leading-trailing-whitespace', 'Password cannot start or end with spaces', (value) => value === value.trim())
          .max(20, 'Password must be less than 20 characters')
      })}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          setLoginError('')
          const result = await login(values.username, values.password)

          if (result.success) {
            if (checked) {
              localStorage.setItem('username', values.username)
            }

            // Chuyển hướng đến trang chính
            window.location.href = '/'
          } else {
            setLoginError(result.error)
          }
        } catch (error) {
          setLoginError('Đã xảy ra lỗi. Vui lòng thử lại.')
          console.error(error)
        } finally {
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
                  onKeyDown={event => handleKeyDown(event, handleSubmit)}
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
                  sx={{
                    '& input[type=password]::-ms-reveal, & input[type=password]::-ms-clear': {
                      display: 'none'
                    }
                  }}
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
                  onKeyDown={event => handleKeyDown(event, handleSubmit)}
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
                  <Link variant='h6' component='button' onClick={() => setShowForgotPassword(true)} color='text.primary' underline='hover'>
                    Forgot Password?
                  </Link>
                  <Link variant='h6' component='button' onClick={handleResetAdminPassword} color='error.main' underline='hover'>
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

AuthLogin.propTypes = {
  isDemo: PropTypes.bool,
  setShowForgotPassword: PropTypes.func.isRequired
}
