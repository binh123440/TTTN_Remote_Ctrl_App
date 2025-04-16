import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import AnimateButton from 'components/@extended/AnimateButton';

import axiosClient from 'api/axiosClient';

// ============================|| JWT - LOGIN ||============================ // 

export default function AuthLogin({ isDemo = false }) {
  const [checked, setChecked] = React.useState(false);
  const navigate = useNavigate(); // gọi useNavigate() để sử dụng navigate

  return (
    <>
      <Formik
        initialValues={{
          username: '',
          password: ''
        }}
        validationSchema={Yup.object().shape({
          username: Yup.string().required('Username is required'),
          password: Yup.string().required('Password is required')
        })}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            const formData = new URLSearchParams();
            formData.append('username', values.username);
            formData.append('password', values.password);

            const response = await axiosClient.post('/token', formData);
            const { access_token } = response.data;

            // Lưu access_token và username vào localStorage
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('username', values.username); // Lưu username vào localStorage

            // Điều hướng đến trang dashboard sau khi đăng nhập thành công
            navigate('/dashboard/default');
          } catch (error) {
            console.error(error);
            setErrors({ submit: 'Invalid username or password' });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ errors, handleBlur, handleChange, touched, values, handleSubmit }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="username-login">Username</InputLabel>
                  <OutlinedInput
                    id="username-login"
                    type="text"
                    value={values.username}
                    name="username"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter username"
                    fullWidth
                    error={Boolean(touched.username && errors.username)}
                  />
                </Stack>
                {touched.username && errors.username && (
                  <FormHelperText error id="standard-weight-helper-text-username-login">
                    {errors.username}
                  </FormHelperText>
                )}
              </Grid>

              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login">Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-login"
                    type="password"  // Chỉ giữ lại type là "password"
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>

              {errors.submit && (
                <Grid size={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}

              <Grid sx={{ mt: -1 }} size={12}>
                <Stack direction="row" sx={{ gap: 2, alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <FormHelperText error>
                    {/* Link "Forgot Password" */}
                    <RouterLink to="/reset-password">Reset Password?</RouterLink>
                  </FormHelperText>
                </Stack>
              </Grid>

              <Grid size={12}>
                <AnimateButton>
                  <Button fullWidth size="large" variant="contained" color="primary" type="submit">
                    Login
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
