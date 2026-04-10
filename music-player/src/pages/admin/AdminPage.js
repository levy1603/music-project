// src/pages/admin/AdminPage.js
import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStats from "../../components/admin/AdminStats";
import AdminSongs from "../../components/admin/AdminSongs";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminPlaylists from "../../components/admin/AdminPlaylists";
import AdminSettings from "../../components/admin/AdminSettings";
import AdminUploads from "../../components/admin/AdminUploads"; // ← thêm

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("stats");

  const renderContent = () => {
    switch (activeTab) {
      case "stats":     return <AdminStats />;
      case "songs":     return <AdminSongs />;
      case "users":     return <AdminUsers />;
      case "playlists": return <AdminPlaylists />;
      case "uploads":   return <AdminUploads />;   // ← thêm
      case "settings":  return <AdminSettings />;
      default:          return <AdminStats />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;