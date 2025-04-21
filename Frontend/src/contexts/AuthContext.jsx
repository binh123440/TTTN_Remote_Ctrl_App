import React, { createContext, useContext, useState } from 'react';

// Tạo Context
const AuthContext = createContext();

// Provider để bọc toàn bộ ứng dụng
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuZ29jaGFvIiwicm9sZSI6InRlYW1fbGVhZCIsImV4cCI6MTc0NTI1MzA1OX0.TP5p0JqW9VhU0sLBMV_J-pORWMbNRRQ_3Dd8H1zFsEA`
  );

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => useContext(AuthContext);