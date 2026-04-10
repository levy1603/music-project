// src/components/admin/AdminSongs.js
import React, { useEffect, useState } from "react";
import { FaTrash, FaSearch, FaHeadphones, FaHeart } from "react-icons/fa";
import { useMusicContext } from "../../context/MusicContext";
import "./AdminSongs.css";

const AdminSongs = () => {
  const { songs, fetchSongs, getCoverURL } = useMusicContext();
  const [search, setSearch]   = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchSongs(); }, []);

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (songId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài hát này?")) return;
    setDeleting(songId);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/songs/${songId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchSongs();
    } catch (err) {
      console.error("Lỗi xóa bài hát:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin-songs">

      {/* Search */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Tìm bài hát, nghệ sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{filtered.length} bài hát</span>
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Bài hát</th>
            <th>Nghệ sĩ</th>
            <th>Album</th>
            <th>Upload bởi</th>
            <th><FaHeadphones /></th>
            <th><FaHeart /></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((song, index) => (
            <tr key={song._id}>
              <td>{index + 1}</td>
              <td>
                <div className="song-cell">
                  <img
                    src={getCoverURL(song)}
                    alt={song.title}
                    onError={(e) => { e.target.src = "/images/default-cover.jpg"; }}
                  />
                  <span>{song.title}</span>
                </div>
              </td>
              <td>{song.artist}</td>
              <td>{song.album || "Single"}</td>
              <td>{song.uploadedBy?.username || "N/A"}</td>
              <td>{song.playCount || 0}</td>
              <td>{song.likeCount || 0}</td>
              <td>
                <button
                  className="btn-delete-song"
                  onClick={() => handleDelete(song._id)}
                  disabled={deleting === song._id}
                  title="Xóa bài hát"
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

export default AdminSongs;