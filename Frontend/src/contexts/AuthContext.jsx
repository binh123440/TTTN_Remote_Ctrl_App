import React, { createContext, useContext, useState } from 'react';

// Tạo Context
const AuthContext = createContext();

// Provider để bọc toàn bộ ứng dụng
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJuZ29jaGFvIiwicm9sZSI6InRlYW1fbGVhZCIsImV4cCI6MTc0NTA3OTc3Mn0.FFSMApaH1QFL9nxmAsBN6QcoQnM2IuDfKraSF3D9tUM`
  );

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => useContext(AuthContext);