// src/components/admin/AdminPlaylists.js
import React, { useEffect, useState } from "react";
import { FaTrash, FaSearch, FaLock, FaGlobe } from "react-icons/fa";
import "./AdminSongs.css"; // Dùng chung CSS

const AdminPlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await fetch("/api/playlists/public", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setPlaylists(data.data);
      } catch (err) {
        console.error("Lỗi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  const filtered = playlists.filter((pl) =>
    pl.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa playlist này?")) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlaylists((prev) => prev.filter((pl) => pl._id !== id));
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Đang tải...</p></div>;

  return (
    <div className="admin-songs">
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Tìm playlist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{filtered.length} playlist</span>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên playlist</th>
            <th>Chủ sở hữu</th>
            <th>Số bài</th>
            <th>Chế độ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((pl, index) => (
            <tr key={pl._id}>
              <td>{index + 1}</td>
              <td>{pl.name}</td>
              <td>{pl.owner?.username || "N/A"}</td>
              <td>{pl.songs?.length || 0}</td>
              <td>
                <span className={`role-badge ${pl.isPublic ? "user" : "admin"}`}>
                  {pl.isPublic ? <><FaGlobe /> Công khai</> : <><FaLock /> Riêng tư</>}
                </span>
              </td>
              <td>
                <button
                  className="btn-delete-song"
                  onClick={() => handleDelete(pl._id)}
                  title="Xóa playlist"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPlaylists;