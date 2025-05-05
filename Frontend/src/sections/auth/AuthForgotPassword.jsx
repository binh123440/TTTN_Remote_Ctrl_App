import PropTypes from 'prop-types';
import React from 'react';
import { useState } from 'react';
import axios from 'axios';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';

import * as Yup from 'yup';
import { Formik } from 'formik';

import AnimateButton from 'components/@extended/AnimateButton';

const API_BASE_URL = 'http://localhost:8000';

export default function AuthForgotPassword({ setShowForgotPassword }) {
    const [step, setStep] = useState(1); // step 1: nhập email/phone, step 2: nhập OTP + new password
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    return (
        <Formik
            initialValues={{
                emailOrPhone: '',
                otp: '',
                newPassword: '',
                submit: null
            }}
            validationSchema={Yup.object().shape(
                step === 1
                    ? {
                        emailOrPhone: Yup.string().required('Email or Phone is required')
                    }
                    : {
                        otp: Yup.string().required('OTP is required'),
                        newPassword: Yup.string()
                            .required('New Password is required')
                            .min(6, 'Password must be at least 6 characters')
                    }
            )}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                    setErrorMessage('');
                    if (step === 1) {
                        await axios.post(`${API_BASE_URL}/forgot-password/`, {
                            email_or_phone: values.emailOrPhone
                        });
                        setEmailOrPhone(values.emailOrPhone);
                        setStep(2);
                    } else {
                        await axios.post(`${API_BASE_URL}/reset-password/`, {
                            email_or_phone: emailOrPhone,
                            otp: values.otp,
                            new_password: values.newPassword
                        });
                        alert('Password reset successfully!');
                        setShowForgotPassword(false);
                    }
                } catch (error) {
                    console.error('Forgot password error:', error);
                    setErrorMessage(error.response?.data?.detail || 'Something went wrong.');
                    setSubmitting(false);
                }
            }}
        >
            {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                <form noValidate onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {errorMessage && (
                            <Grid size={12}>
                                <Alert severity="error">{errorMessage}</Alert>
                            </Grid>
                        )}

                        {step === 1 && (
                            <Grid size={12}>
                                <Stack sx={{ gap: 1 }}>
                                    <InputLabel htmlFor="emailOrPhone">Email or Phone</InputLabel>
                                    <OutlinedInput
                                        id="emailOrPhone"
                                        type="text"
                                        value={values.emailOrPhone}
                                        name="emailOrPhone"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        placeholder="Enter your email or phone"
                                        fullWidth
                                        error={Boolean(touched.emailOrPhone && errors.emailOrPhone)}
                                    />
                                </Stack>
                                {touched.emailOrPhone && errors.emailOrPhone && (
                                    <FormHelperText error>{errors.emailOrPhone}</FormHelperText>
                                )}
                            </Grid>
                        )}

                        {step === 2 && (
                            <>
                                <Grid size={12}>
                                    <Stack sx={{ gap: 1 }}>
                                        <InputLabel htmlFor="otp">OTP</InputLabel>
                                        <OutlinedInput
                                            id="otp"
                                            type="text"
                                            value={values.otp}
                                            name="otp"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            placeholder="Enter OTP"
                                            fullWidth
                                            error={Boolean(touched.otp && errors.otp)}
                                        />
                                    </Stack>
                                    {touched.otp && errors.otp && (
                                        <FormHelperText error>{errors.otp}</FormHelperText>
                                    )}
                                </Grid>

                                <Grid size={12}>
                                    <Stack sx={{ gap: 1 }}>
                                        <InputLabel htmlFor="newPassword">New Password</InputLabel>
                                        <OutlinedInput
                                            id="newPassword"
                                            type="password"
                                            value={values.newPassword}
                                            name="newPassword"
                                            onBlur={handleBlur}
                                            onChange={handleChange}
                                            placeholder="Enter new password"
                                            fullWidth
                                            error={Boolean(touched.newPassword && errors.newPassword)}
                                        />
                                    </Stack>
                                    {touched.newPassword && errors.newPassword && (
                                        <FormHelperText error>{errors.newPassword}</FormHelperText>
                                    )}
                                </Grid>
                            </>
                        )}

                        <Grid size={12}>
                            <AnimateButton>
                                <Button fullWidth size="large" type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                                    {step === 1 ? 'Send OTP' : 'Reset Password'}
                                </Button>
                            </AnimateButton>
                        </Grid>

                        <Grid size={12}>
                            <Stack direction="row" justifyContent="center" spacing={2}>
                                <Link component="button" onClick={() => setShowForgotPassword(false)} variant="body2">
                                    Back to Login
                                </Link>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>
            )}
        </Formik>
    );
}

AuthForgotPassword.propTypes = {
    setShowForgotPassword: PropTypes.func
};