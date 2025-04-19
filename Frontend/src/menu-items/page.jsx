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
  UserSwitchOutlined
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
  UserSwitchOutlined
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
];

// Định nghĩa mục menu dành riêng cho admin
const adminMenuItem = {
  id: 'user-management',
  title: 'User Management',
  type: 'item',
  url: '/admin/users',
  icon: icons.UserSwitchOutlined,
  target: false
};

// Tạo danh sách menu dựa trên role
const getMenuItems = () => {
  const role = getUserRole();
  
  // Nếu chưa đăng nhập, chỉ hiện login và register
  if (!role) {
    return unauthenticatedMenuItems;
  }
  
  // Nếu đã đăng nhập, hiển thị menu chung
  const authenticatedMenuItems = [...commonMenuItems];
  
  // Nếu là admin, thêm menu quản lý người dùng
  if (role === 'admin') {
    authenticatedMenuItems.splice(0, 0, adminMenuItem); // Thêm vào đầu danh sách
  }
  
  return authenticatedMenuItems;
};

const pages = {
  id: 'admin',
  type: 'group',
  children: getMenuItems()
};

export default pages
