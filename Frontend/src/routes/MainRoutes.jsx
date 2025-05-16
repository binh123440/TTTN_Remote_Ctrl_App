import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import UpdatePassword from 'layout/Dashboard/Header/HeaderContent/Profile/UpdatePassword';
import CommandForm from '../pages/teamlead/commandForm';
import CommandsPage from '../pages/teamlead/commandPage';

import DeviceGroupManagement from '../pages/teamlead/DeviceGroupManagement';
import DeviceManagement from '../pages/teamlead/DeviceManagement';
import SSHCommandInterface from '../pages/operator/SSHCommandInterface';
import FileEditor from '../pages/operator/FileEditor';
import SessionHistoryView from '../pages/supervisor/SessionHistoryView';
import SSHWebSocketTerminal from '../pages/operator/SSHWebSocketTerminal'; // Import component

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

// Get user role from token
const getUserRole = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch (e) {
    return null;
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

// Admin guard component - only allows admin users
const AdminGuard = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (getUserRole() !== 'admin') {
    return <Navigate to="/dashboard/default" state={{ from: location }} replace />;
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
      path: 'forgot-password',
      element: <forgot-password />
    },
    {
      path: 'reset-password',
      element: <reset-password />
    },
    {
      path: '/admin/users',
      element: (
        <AdminGuard>
          <UserManagement />
        </AdminGuard>
      )
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
    },
    {
      path: 'commands',
      element: <CommandsPage />
    },
    {
      path: 'commands/new',
      element: <CommandForm />
    },
    {
      path: 'commands/edit/:id',
      element: <CommandForm />
    },
    {
      path: '/device-groups',
      element: <DeviceGroupManagement />,
      roles: ['team_lead']
    },
    {
      path: '/devices',
      element: <DeviceManagement />,
      roles: ['team_lead']
    },
    
    // Operator routes
    {
      path: '/ssh-command',
      element: <SSHCommandInterface />,
      roles: ['operator']
    },
    {
      path: '/file-editor',
      element: <FileEditor />,
      roles: ['operator']
    },
    {
      path: '/operator/ssh-websocket',
      element: <SSHWebSocketTerminal />,
      roles: ['operator']
    },
    // Supervisor routes
    {
      path: '/session-history',
      element: <SessionHistoryView />,
      roles: ['supervisor']
    },
  ]
};

export default MainRoutes;
