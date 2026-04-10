// src/components/playlist/PlaylistItem.js
import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaEdit, FaTrash, FaLock, FaGlobe, FaEllipsisV, FaMusic } from "react-icons/fa";
import { useMusicContext } from "../../context/MusicContext";
import "./PlaylistItem.css";

const PlaylistItem = ({ playlist, index, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { getCoverURL } = useMusicContext();
  const menuRef = useRef(null); // ✅ Ref detect click outside

  // ✅ Click outside → đóng menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleMenuClick = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  const getItemCover = () => {
    const firstSong = playlist.songs?.[0];
    if (firstSong) return getCoverURL(firstSong);
    return "/images/default-playlist.jpg";
  };

  return (
    <div className="playlist-item-row" onClick={onClick}>

      {/* Số thứ tự */}
      <span className="item-index">{index}</span>

      {/* Ảnh */}
      <div className="item-cover">
        {playlist.songs?.length ? (
          <img src={getItemCover()} alt={playlist.name} />
        ) : (
          <div className="item-cover-empty">
            <FaMusic />
          </div>
        )}
        <div className="item-play-overlay">
          <FaPlay />
        </div>
      </div>

      {/* Tên + mô tả */}
      <div className="item-info">
        <h4>{playlist.name}</h4>
        <p>{playlist.description || "Không có mô tả"}</p>
      </div>

      {/* Số bài */}
      <span className="item-song-count">{playlist.songs?.length || 0} bài</span>

      {/* Public / Private */}
      <span className={`item-badge ${playlist.isPublic ? "public" : "private"}`}>
        {playlist.isPublic ? <FaGlobe /> : <FaLock />}
      </span>

      {/* ✅ Menu */}
      <div
        className="item-menu-wrapper"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn-menu"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <FaEllipsisV />
        </button>

        {showMenu && (
          <div className="item-dropdown">
            <button onClick={(e) => handleMenuClick(e, onEdit)}>
              <FaEdit /> Chỉnh sửa
            </button>
            <button
              className="danger"
              onClick={(e) => handleMenuClick(e, onDelete)}
            >
              <FaTrash /> Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistItem;