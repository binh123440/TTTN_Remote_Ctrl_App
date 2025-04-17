// assets
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  LaptopOutlined,
  CodeOutlined,
  ProfileOutlined
} from '@ant-design/icons';

// icons
const icons = {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  LaptopOutlined,
  CodeOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const pages = {
  id: 'admin',
  type: 'group',
  children: [
    {
      id: 'home',
      title: 'Home',
      type: 'item',
      url: '/home',
      icon: icons.HomeOutlined,
      target: false
    },
    {
      id: 'team',
      title: 'Team',
      type: 'item',
      url: '/team',
      icon: icons.TeamOutlined,
      target: false
    },
    {
      id: 'uses',
      title: 'Users',
      type: 'item',
      url: '/users',
      icon: icons.UserOutlined,
      target: false
    },
    {
      id: 'device',
      title: 'Devices',
      type: 'item',
      url: '/device',
      icon: icons.LaptopOutlined,
      target: false
    },
    {
      id: 'command',
      title: 'Commands',
      type: 'item',
      url: '/command',
      icon: icons.CodeOutlined,
      target: false
    },
    {
      id: 'profile',
      title: 'Profile',
      type: 'item',
      url: '/profile',
      icon: icons.ProfileOutlined,
      target: false
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/settings',
      icon: icons.ToolOutlined,
      target: false
    }
  ]
};

export default pages;
