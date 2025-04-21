import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import CommandForm from '../pages/teamlead/commandForm';
import CommandsPage from '../pages/teamlead/commandPage';
import CreateDevice from '../pages/teamlead/createDevice';
import CreateDeviceGroup from '../pages/teamlead/createDeviceGroup';
import DevicesPage from '../pages/teamlead/devicePage';
import DeviceGroupsPage from '../pages/teamlead/deviceGroupsPage';
// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));
const UserManagement = Loadable(lazy(() => import('pages/admin/UserManagement')));


// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <DashboardLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
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
      path: 'devices',
      element: <DevicesPage />,
    },
    {
      path: 'devices/new',
      element: <CreateDevice />,
    },
    {
      path: 'devices/edit/:id',
      element: <CreateDevice />,
    },
    {
      path: 'device-groups/edit/:id',
      element: <CreateDeviceGroup />,
    },
    {
      path: 'device-groups',
      element: <DeviceGroupsPage />, // Trang hiển thị danh sách Device Groups
    },
    {
      path: 'device-groups/new',
      element: <CreateDeviceGroup />,
    }
  ]
};

export default MainRoutes;
