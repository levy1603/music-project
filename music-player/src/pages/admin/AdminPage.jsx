// src/pages/admin/AdminPage.js
import React, { useState, useCallback } from "react";
import AdminLayout    from "../../components/admin/AdminLayout";
import AdminStats     from "../../components/admin/AdminStats";
import AdminSongs     from "../../components/admin/AdminSongs";
import AdminUsers     from "../../components/admin/AdminUsers";
import AdminPlaylists from "../../components/admin/AdminPlaylists";
import AdminSettings  from "../../components/admin/AdminSettings";
import AdminUploads   from "../../components/admin/AdminUploads";

const AdminPage = () => {
  const [activeTab,       setActiveTab]       = useState("stats");
  const [highlightSongId, setHighlightSongId] = useState(null);
  const handleNavigateToSong = useCallback((songId) => {
    setActiveTab("uploads");
    setHighlightSongId(songId);
    setTimeout(() => setHighlightSongId(null), 6000);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "stats":     return <AdminStats />;
      case "songs":     return <AdminSongs />;
      case "users":     return <AdminUsers />;
      case "playlists": return <AdminPlaylists />;
      case "settings":  return <AdminSettings />;
      case "uploads":
        return (
          <AdminUploads
            highlightSongId={highlightSongId}
            onClearHighlight={() => setHighlightSongId(null)}
          />
        );
      default: return <AdminStats />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onNavigateToSong={handleNavigateToSong} 
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;