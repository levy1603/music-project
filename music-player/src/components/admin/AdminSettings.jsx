// src/components/admin/AdminSettings.js
import React from "react";
import { FaCog } from "react-icons/fa";

const AdminSettings = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "400px",
      color: "#999",
      gap: "16px"
    }}>
      <FaCog style={{ fontSize: "48px", opacity: 0.3 }} />
      <p style={{ fontSize: "16px" }}>Tính năng đang phát triển...</p>
    </div>
  );
};

export default AdminSettings;