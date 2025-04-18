import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';

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
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '/create-profile',
      element: <CreateProfile />
    },
        // {
        //   path: 'edit/:id',
        //   element: <EditProfile />
        // },
        // {
        //   path: 'view/:id',
        //   element: <ViewProfile />
        // },
        // {
        //   path: 'delete/:id',
        //   element: <DeleteProfile />
        // },
    {
      path: 'assign-profile',
      element: <AssignProfile />
    }
  ]
};

export default MainRoutes;
