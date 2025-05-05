import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Tạo Context
const AuthContext = createContext();

// Provider để bọc toàn bộ ứng dụng
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('accessToken') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse token để lấy thông tin người dùng
  useEffect(() => {
    const parseToken = async () => {
      if (token) {
        try {
          // Lưu token vào localStorage
          localStorage.setItem('accessToken', token);
          
          // Parse JWT payload
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));
          
          setUser({
            username: payload.sub,
            role: payload.role,
            exp: payload.exp
          });
          
        } catch (error) {
          console.error('Lỗi khi parse token:', error);
          logout(); // Token không hợp lệ, đăng xuất
        }
      }
      setLoading(false);
    };

    parseToken();
  }, [token]);

  // Kiểm tra token hết hạn
  useEffect(() => {
    if (user && user.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (user.exp < currentTime) {
        // Token đã hết hạn
        logout();
      } else {
        // Thiết lập timer để tự động đăng xuất khi token hết hạn
        const timeLeft = user.exp - currentTime;
        const logoutTimer = setTimeout(() => {
          logout();
        }, timeLeft * 1000);
        
        return () => clearTimeout(logoutTimer);
      }
    }
  }, [user]);

  // Hàm đăng nhập
  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post('http://localhost:8000/token', formData);
      
      if (response.data && response.data.access_token) {
        setToken(response.data.access_token);
        return { success: true };
      }
      
      return { success: false, error: 'Đăng nhập thất bại' };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Đăng nhập thất bại, vui lòng thử lại'
      };
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      if (token) {
        // Gọi API đăng xuất (nếu cần)
        try {
          await axios.post('http://localhost:8000/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          console.log('Không thể gọi API đăng xuất:', e);
        }
      }
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      // Luôn xóa token và user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      localStorage.removeItem('tokenType');
      setToken(null);
      setUser(null);
    }
  };

  // Kiểm tra xem người dùng đã đăng nhập chưa
  const isAuthenticated = () => {
    if (!token || !user) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return user.exp > currentTime;
  };

  // Kiểm tra role người dùng
  const hasRole = (requiredRole) => {
    if (!isAuthenticated()) return false;
    return user.role === requiredRole;
  };

  // Lấy role người dùng
  const getRole = () => {
    if (!isAuthenticated()) return null;
    return user.role;
  };

  // Context value
  const contextValue = {
    token,
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    getRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng trong AuthProvider');
  }
  return context;
};