import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import path from 'path';

// render- Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - color
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const Profile = Loadable(lazy(() => import('pages/component-overview/profiles/profile')));
const CreateProfile = Loadable(lazy(() => import('pages/component-overview/profiles/profile-create')));
const AssignProfile = Loadable(lazy(() => import('pages/component-overview/profiles/profile-assign')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

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
      path: 'home',
      element: <DashboardDefault />
    },
    {
      path: 'team',
      element: <Color />
    },
    {
      path: 'users',
      element: <Shadow />
    },
    {
      path: 'device',
      element: <SamplePage />
    },
    {
      path: 'profile',
      element: <Profile />,
    },
    {
      path: 'create-profile',
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
