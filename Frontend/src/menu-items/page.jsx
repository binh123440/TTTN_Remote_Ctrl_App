// assets
import { 
  HomeOutlined, 
  UserOutlined, 
  TeamOutlined, 
  ToolOutlined, 
  LaptopOutlined, 
  CodeOutlined, 
  ProfileOutlined,
  LoginOutlined,
  UserSwitchOutlined,
  DashboardOutlined,
  FileOutlined
} from '@ant-design/icons'

// icons
const icons = {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  LaptopOutlined,
  CodeOutlined,
  ProfileOutlined,
  LoginOutlined,
  UserSwitchOutlined,
  DashboardOutlined,
  FileOutlined
}

// Helper function để check role từ token
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

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

// Định nghĩa các mục menu cho người chưa đăng nhập
const unauthenticatedMenuItems = [
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
  }
];

// Định nghĩa các mục menu chung cho tất cả người dùng đã đăng nhập
const commonMenuItems = [
  {
    id: 'home',
    title: 'Home',
    type: 'item',
    url: '/dashboard/default',
    icon: icons.HomeOutlined,
    target: false
  },
  {
    id: 'settings',
    title: 'Update Password',
    type: 'item',
    url: '/update-password',
    icon: icons.ToolOutlined,
    target: false
  }
];

// Định nghĩa menu admin
const adminMenuItems = [
  {
    id: 'user-management',
    title: 'User Management',
    type: 'item',
    url: '/admin/users',
    icon: icons.UserSwitchOutlined,
    target: false
  }
];

// Định nghĩa menu team lead
const teamleadMenuItems = [
  {
    id: 'device',
    title: 'Devices',
    type: 'item',
    url: '/devices',
    icon: icons.LaptopOutlined,
    target: false
  },
  {
    id: 'command',
    title: 'Commands',
    type: 'item',
    url: '/commands',
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
  }
];

// Định nghĩa menu operator
const operatorMenuItems = [
  {
    id: 'device-view',
    title: 'Sent Command',
    type: 'item',
    url: '/ssh-command',
    icon: icons.LaptopOutlined,
    target: false
  },
  {
    id: 'device-view',
    title: 'Edit file',
    type: 'item',
    url: 'operator/ssh-websocket',
    icon: icons.LaptopOutlined,
    target: false
  }
];
const supervisorMenuItems = [
  {
    id: 'team',
    title: 'Session History',
    type: 'item',
    url: '/session-history',
    icon: icons.TeamOutlined,
    target: false
  }
];
// Tạo danh sách menu dựa trên role
const getMenuItems = () => {
  const role = getUserRole();
  
  // Nếu chưa đăng nhập, chỉ hiện login và register
  if (!role) {
    return unauthenticatedMenuItems;
  }
  
  // Bắt đầu với menu chung cho tất cả người dùng
  let menuItems = [...commonMenuItems];

  // Thêm menu theo role
  if (role === 'admin') {
    // Thêm menu admin vào đầu danh sách
    menuItems = [...menuItems,...adminMenuItems];
  } 
  else if (role === 'team_lead') {
    // Thêm menu team lead vào đầu danh sách
    menuItems = [...menuItems,...teamleadMenuItems,];
  }
  else if (role === 'operator') {
    // Thêm menu operator vào đầu danh sách
    menuItems = [...menuItems,...operatorMenuItems];
  }
  else if (role === 'supervisor') {
    // Thêm menu supervisor vào đầu danh sách
    menuItems = [...menuItems,...supervisorMenuItems];
  }
  
  return menuItems;
};

const pages = {
  id: 'user',
  type: 'group',
  children: getMenuItems()
};

export default pages
