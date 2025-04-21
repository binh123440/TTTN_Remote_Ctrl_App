// // assets
// import { DashboardOutlined } from '@ant-design/icons';

// // icons
// const icons = {
//   DashboardOutlined
// };

// // ==============================|| MENU ITEMS - DASHBOARD ||============================== //

// const dashboard = {
//   id: 'group-dashboard',
//   title: 'Navigation',
//   type: 'group',
//   children: [
//     {
//       id: 'dashboard',
//       title: 'Dashboard',
//       type: 'item',
//       url: '/dashboard/default',
//       icon: icons.DashboardOutlined,
//       breadcrumbs: false
//     }
//   ]
// };

// export default dashboard;
// assets
import { DashboardOutlined, TeamOutlined, UserOutlined, LaptopOutlined, CodeOutlined, ProfileOutlined, SettingOutlined } from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LaptopOutlined,
  CodeOutlined,
  ProfileOutlined,
  SettingOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: '',
  type: 'group',
  children: [
    {
      id: 'home',
      title: 'Home',
      type: 'item',
      url: '/home',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'team',
      title: 'Team',
      type: 'item',
      url: '/team',
      icon: icons.TeamOutlined,
      breadcrumbs: false
    },
    {
      id: 'users',
      title: 'Users',
      type: 'item',
      url: '/users',
      icon: icons.UserOutlined,
      breadcrumbs: false
    },
    {
      id: 'device-list',
      title: 'Device List',
      type: 'item',
      url: '/devices',
      icon: icons.LaptopOutlined,
      breadcrumbs: false
    },
    {
      id: 'device-groups',
      title: 'Device Groups',
      type: 'item',
      url: '/device-groups',
      icon: icons.TeamOutlined,
      breadcrumbs: false
    },
    {
      id: 'commands',
      title: 'Commands',
      type: 'item',
      url: '/commands',
      icon: icons.CodeOutlined,
      breadcrumbs: false
    },
    {
      id: 'profile',
      title: 'Profile',
      type: 'item',
      url: '/profile',
      icon: icons.ProfileOutlined,
      breadcrumbs: false
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.SettingOutlined,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
