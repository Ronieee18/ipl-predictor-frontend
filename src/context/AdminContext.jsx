import React, { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminSecret, setAdminSecret] = useState(
    () => localStorage.getItem("ipl_admin_secret") || null,
  );

  const adminLogin = (secret) => {
    setAdminSecret(secret);
    localStorage.setItem("ipl_admin_secret", secret);
  };

  const adminLogout = () => {
    setAdminSecret(null);
    localStorage.removeItem("ipl_admin_secret");
  };

  return (
    <AdminContext.Provider value={{ adminSecret, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
