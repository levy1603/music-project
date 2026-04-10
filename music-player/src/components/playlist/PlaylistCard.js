// src/components/playlist/PlaylistCard.js
import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaEllipsisV, FaEdit, FaTrash, FaLock, FaGlobe, FaMusic } from "react-icons/fa";
import { useMusicContext } from "../../context/MusicContext";
import "./PlaylistCard.css";

const PlaylistCard = ({ playlist, onClick, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { getCoverURL } = useMusicContext();
  const menuRef = useRef(null); // ✅ Ref để detect click outside

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

  const getCardCover = () => {
    const firstSong = playlist.songs?.[0];
    if (firstSong) return getCoverURL(firstSong);
    return "/images/default-playlist.jpg";
  };

  return (
    <div className="playlist-card" onClick={onClick}>

      {/* ===== Ảnh bìa ===== */}
      <div className="card-cover">
        <img src={getCardCover()} alt={playlist.name} />
        <div className="card-overlay">
          <button className="btn-play-card">
            <FaPlay />
          </button>
        </div>
        {!playlist.songs?.length && (
          <div className="card-empty-cover">
            <FaMusic />
          </div>
        )}
      </div>

      {/* ===== Thông tin ===== */}
      <div className="card-info">
        <div className="card-info-top">
          <div>
            <h4 className="card-name">{playlist.name}</h4>
            <p className="card-songs">{playlist.songs?.length || 0} bài hát</p>
          </div>

          {/* ✅ Menu 3 chấm */}
          <div className="card-menu-wrapper" ref={menuRef}>
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
              <div className="card-dropdown">
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

        <span className={`card-badge ${playlist.isPublic ? "public" : "private"}`}>
          {playlist.isPublic
            ? <><FaGlobe /> Công khai</>
            : <><FaLock /> Riêng tư</>
          }
        </span>
      </div>
    </div>
  );
};

export default PlaylistCard;