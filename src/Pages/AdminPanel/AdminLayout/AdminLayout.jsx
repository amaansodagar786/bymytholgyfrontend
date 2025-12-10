import React from "react";
import "./AdminLayout.scss";
import AdminSidebar from "../AdminSidebar/AdminSidebar";

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">{children}</div>
    </div>
  );
}

export default AdminLayout;
