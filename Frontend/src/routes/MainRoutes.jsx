import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import UpdatePassword from 'layout/Dashboard/Header/HeaderContent/Profile/UpdatePassword';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));
const UserManagement = Loadable(lazy(() => import('pages/admin/UserManagement')));
const Profile = Loadable(lazy(() => import('pages/profiles/profile')));
const CreateProfile = Loadable(lazy(() => import('pages/profiles/profile-create')));
const AssignProfile = Loadable(lazy(() => import('pages/profiles/profile-assign')));

// Authentication check helper
const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  
  try {
    // Basic check if token format is valid
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

// Authentication guard component
const AuthGuard = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Save the location they were trying to go to for later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <DashboardLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: '/',
      element: <Navigate to="/dashboard/default" replace />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: '/admin/users',
      element: <UserManagement />
    },
    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '/create-profile',
      element: <CreateProfile />
    },
    {
      path: 'assign-profile',
      element: <AssignProfile />
    },
    {
      path: 'update-password',
      element: <UpdatePassword />
    }
  ]
};

export default MainRoutes;
