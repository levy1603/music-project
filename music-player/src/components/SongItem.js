// src/components/SongItem.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaPlus } from "react-icons/fa";
import { useMusicContext } from "../context/MusicContext";
import { useAuth } from "../context/AuthContext";
import AddToPlaylistModal from "./playlist/AddToPlaylistModal";
import "./SongItem.css";

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SongItem = ({ song, index, source = "home", queue = [] }) => { // ✅ Thêm props
  const {
    currentSong,
    isPlaying,
    songs,
    playSong,
    togglePlay,
    toggleFavorite,
    isFavorite,
    getCoverURL,
  } = useMusicContext();

  const { isAuthenticated } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const isCurrentSong = currentSong && currentSong._id === song._id;
  const liked         = isFavorite(song._id);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentSong) {
      togglePlay();
    } else {
      // ✅ Dùng queue được truyền vào, fallback về songs nếu rỗng
      const playQueue = queue.length > 0 ? queue : songs;
      playSong(song, source, playQueue);
    }
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(song._id);
  };

  const handleOpenAddModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowAddModal(true);
  };

  return (
    <>
      <div className={`song-item ${isCurrentSong ? "active" : ""}`}>

        {/* Index */}
        <div className="song-index">
          {isCurrentSong && isPlaying ? (
            <div className="playing-animation">
              <span></span><span></span><span></span>
            </div>
          ) : (
            <span className="index-number">{index + 1}</span>
          )}
        </div>

        {/* Cover */}
        <div className="song-cover-wrapper" onClick={handlePlay}>
          <img src={getCoverURL(song)} alt={song.title} className="song-cover" />
          <div className="song-cover-overlay">
            {isCurrentSong && isPlaying ? <FaPause /> : <FaPlay />}
          </div>
        </div>

        {/* Info */}
        <div className="song-info">
          <Link to={`/song/${song._id}`} className="song-title-link">
            <h4 className={`song-title ${isCurrentSong ? "highlight" : ""}`}>
              {song.title}
            </h4>
          </Link>
          <p className="song-artist">{song.artist}</p>
        </div>

        {/* Duration */}
        <div className="song-duration">{formatDuration(song.duration)}</div>

        {/* Album */}
        <div className="song-album">{song.album || "Single"}</div>

        {/* Lượt nghe */}
        <div className="song-play-count">{song.playCount || 0} lượt nghe</div>

        {/* Actions */}
        <div className="song-actions">
          <button
            className={`fav-btn ${liked ? "liked" : ""}`}
            onClick={handleFavorite}
            title={liked ? "Bỏ yêu thích" : "Yêu thích"}
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
          </button>

          {isAuthenticated && (
            <button
              className="add-playlist-btn"
              onClick={handleOpenAddModal}
              title="Thêm vào playlist"
            >
              <FaPlus />
            </button>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddToPlaylistModal
          song={song}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
};

export default SongItem;