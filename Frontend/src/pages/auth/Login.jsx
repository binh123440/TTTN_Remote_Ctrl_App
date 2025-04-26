import { useState } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/AuthLogin';
import AuthForgotPassword from 'sections/auth/AuthForgotPassword'; // <-- thêm dòng này

export default function Login() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    <AuthWrapper>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: { xs: -0.5, sm: 0.5 } }}>
            <Typography variant="h3">{showForgotPassword ? 'Forgot Password' : 'Login'}</Typography>
            {!showForgotPassword && (
              <Typography component={Link} to={'/register'} variant="body1" sx={{ textDecoration: 'none' }} color="primary">
                Don&apos;t have an account?
              </Typography>
            )}
          </Stack>
        </Grid>
        <Grid size={12}>
          {!showForgotPassword ? (
            <AuthLogin setShowForgotPassword={setShowForgotPassword} />
          ) : (
            <AuthForgotPassword setShowForgotPassword={setShowForgotPassword} />
          )}
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
