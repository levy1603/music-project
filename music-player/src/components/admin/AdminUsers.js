// src/components/admin/AdminUsers.js
import React, { useEffect, useState } from "react";
import {
  FaSearch, FaTrash, FaUserShield,
  FaUser, FaBan, FaUnlock,
} from "react-icons/fa";
import "./AdminUsers.css";

const AdminUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error("Lỗi lấy users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ===== XÓA USER =====
  const handleDelete = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setUsers((prev) => prev.filter((u) => u._id !== userId));
      else alert(data.message);
    } catch (err) {
      console.error("Lỗi xóa user:", err);
    }
  };

  // ===== ĐỔI ROLE =====
  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const msg     = newRole === "admin"
      ? "Cấp quyền Admin cho người dùng này?"
      : "Thu hồi quyền Admin của người dùng này?";
    if (!window.confirm(msg)) return;

    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => u._id === userId ? { ...u, role: newRole } : u)
        );
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Lỗi đổi role:", err);
    }
  };

  // ===== KHÓA / MỞ KHÓA =====
  const handleBan = async (userId, isBanned) => {
    const msg = isBanned ? "Mở khóa tài khoản này?" : "Khóa tài khoản này?";
    if (!window.confirm(msg)) return;

    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/users/${userId}/ban`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => u._id === userId ? { ...u, isBanned: !isBanned } : u)
        );
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Lỗi ban user:", err);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner" /><p>Đang tải...</p></div>;

  return (
    <div className="admin-users">

      {/* Search */}
      <div className="admin-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Tìm tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span>{filtered.length} người dùng</span>
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Người dùng</th>
            <th>Email</th>
            <th>Role</th>
            <th>Bài hát</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user, index) => (
            <tr key={user._id} className={user.isBanned ? "banned-row" : ""}>
              <td>{index + 1}</td>

              {/* Avatar + tên */}
              <td>
                <div className="user-cell">
                  <img
                    src={
                      user.avatar
                        ? `http://localhost:5000${user.avatar}`
                        : `https://i.pravatar.cc/32?u=${user._id}`
                    }
                    alt={user.username}
                    onError={(e) => { e.target.src = `https://i.pravatar.cc/32?u=${user._id}`; }}
                  />
                  <span>{user.username}</span>
                </div>
              </td>

              <td>{user.email}</td>

              {/* Role badge */}
              <td>
                <span className={`role-badge ${user.role}`}>
                  {user.role === "admin" ? <FaUserShield /> : <FaUser />}
                  {user.role}
                </span>
              </td>

              <td>{user.uploadCount || 0}</td>

              {/* Trạng thái */}
              <td>
                <span className={`status-badge ${user.isBanned ? "banned" : "active"}`}>
                  {user.isBanned ? "Đã khóa" : "Hoạt động"}
                </span>
              </td>

              {/* Hành động */}
              <td>
                <div className="action-btns">
                  {/* Khóa / Mở khóa */}
                  <button
                    className={`btn-action ${user.isBanned ? "btn-unban" : "btn-ban"}`}
                    onClick={() => handleBan(user._id, user.isBanned)}
                    title={user.isBanned ? "Mở khóa" : "Khóa tài khoản"}
                    disabled={user.role === "admin"}
                  >
                    {user.isBanned ? <FaUnlock /> : <FaBan />}
                  </button>

                  {/* Đổi role */}
                  <button
                    className={`btn-action ${user.role === "admin" ? "btn-demote" : "btn-promote"}`}
                    onClick={() => handleRoleChange(user._id, user.role)}
                    title={user.role === "admin" ? "Thu hồi Admin" : "Cấp Admin"}
                  >
                    <FaUserShield />
                  </button>

                  {/* Xóa */}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(user._id)}
                    title="Xóa tài khoản"
                    disabled={user.role === "admin"}
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;