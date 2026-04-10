// src/components/admin/AdminLayout.js
import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import "./AdminLayout.css";

const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="admin-layout">

      {/* ===== SIDEBAR ===== */}
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* ===== MAIN ===== */}
      <div className={`admin-main ${collapsed ? "collapsed" : ""}`}>

        {/* Header */}
        <AdminHeader activeTab={activeTab} />

        {/* Content */}
        <div className="admin-body">
          {children}
        </div>

      </div>
    </div>
  );
};

export default AdminLayout;