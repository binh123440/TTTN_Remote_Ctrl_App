// assets
import { HomeOutlined, UserOutlined, TeamOutlined, ToolOutlined, LaptopOutlined, CodeOutlined, ProfileOutlined,LoginOutlined } from '@ant-design/icons'

// icons
const icons = {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  LaptopOutlined,
  CodeOutlined,
  ProfileOutlined,
  LoginOutlined
}

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const pages = {
  id: 'admin',
  type: 'group',
  children: [
    {
      id: 'login1',
      title: 'Login',
      type: 'item',
      url: '/login',
      icon: icons.LoginOutlined,
      target: true
    },
    {
      id: 'register1',
      title: 'Register',
      type: 'item',
      url: '/register',
      icon: icons.ProfileOutlined,
      target: true
    },
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
}

export default pages
