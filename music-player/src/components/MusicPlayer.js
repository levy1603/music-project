// src/components/MusicPlayer.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPause,
  FaStepForward,
  FaStepBackward,
  FaRandom,
  FaRedo,
  FaHeart,
  FaRegHeart,
  FaChevronUp,
  FaChevronDown,
  FaListUl,
} from "react-icons/fa";
import { useMusicContext } from "../context/MusicContext";
import "./MusicPlayer.css";

const MusicPlayer = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    repeat,
    shuffle,
    songs,
    favoriteSongIds,
    playSource,
    currentQueue,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    setRepeat,
    setShuffle,
    toggleFavorite,
    isFavorite,
    getCoverURL,
    playSong,
  } = useMusicContext();

  const [expanded,    setExpanded]    = useState(false);
  const [showQueue,   setShowQueue]   = useState(false);
  const [randomQueue, setRandomQueue] = useState([]);
  const navigate  = useNavigate();
  const playerRef = useRef(null);

  // ===== CLICK OUTSIDE ĐỂ ĐÓNG =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (playerRef.current && !playerRef.current.contains(e.target)) {
        setExpanded(false);
        setShowQueue(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== CẬP NHẬT QUEUE KHI SOURCE THAY ĐỔI =====
  useEffect(() => {
    if (showQueue) generateRandomQueue();
    // eslint-disable-next-line
  }, [playSource, currentQueue]);

  // ===== LABEL THEO SOURCE =====
  const getQueueLabel = () => {
    switch (playSource) {
      case "favorites": return "❤️ Từ yêu thích";
      case "playlist":  return "🎵 Từ playlist";
      default:          return "🎲 Gợi ý ngẫu nhiên";
    }
  };

  // ===== TẠO DANH SÁCH QUEUE =====
  const generateRandomQueue = () => {
    if (playSource === "home") {
      // ✅ Trang chủ: random 20 bài từ tất cả songs
      const shuffled = [...songs]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(20, songs.length));
      setRandomQueue(shuffled);
    } else {
      // ✅ Favorites/Playlist: dùng đúng currentQueue
      setRandomQueue(currentQueue);
    }
  };

  // ===== TOGGLE QUEUE =====
  const handleToggleQueue = () => {
    if (!showQueue) generateRandomQueue();
    setShowQueue(!showQueue);
  };

  const goToSongDetail = () => {
    if (currentSong?._id) navigate(`/song/${currentSong._id}`);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const bar  = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleRepeat = () => {
    const modes = ["none", "all", "one"];
    const currentIndex = modes.indexOf(repeat);
    setRepeat(modes[(currentIndex + 1) % modes.length]);
  };

  // ===== KHÔNG CÓ BÀI HÁT =====
  if (!currentSong) {
    return (
      <div className="player-wrapper">
        <div className="player-compact empty">
          <span>🎵 Chọn bài hát để phát</span>
        </div>
      </div>
    );
  }

  return (
    <div className="player-wrapper" ref={playerRef}>

      {/* ===== PLAYER ===== */}
      <div className={`player-compact ${expanded ? "expanded" : ""}`}>

        {/* ===== PHẦN MỞ RỘNG ===== */}
        <div className={`player-expanded-area ${expanded ? "is-expanded" : ""}`}>
          <div className="player-expanded-area-inner">

            {/* Cover lớn */}
            <div
              className="player-cover-large clickable"
              onClick={goToSongDetail}
              title="Xem chi tiết bài hát"
            >
              <img src={getCoverURL(currentSong)} alt={currentSong.title} />
              <div className="cover-detail-overlay">
                <span>Xem chi tiết</span>
              </div>
            </div>

            {/* Tên bài */}
            <div
              className="player-expanded-info clickable"
              onClick={goToSongDetail}
            >
              <h3>{currentSong.title}</h3>
              <p>{currentSong.artist}</p>
            </div>

            {/* Progress lớn */}
            <div className="player-progress-large">
              <span>{formatTime(currentTime)}</span>
              <div className="progress-bar-large" onClick={handleProgressClick}>
                <div
                  className="progress-fill-large"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="progress-thumb-large"></div>
                </div>
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Controls lớn */}
            <div className="player-controls-large">
              <button
                className={`ctrl-btn ${shuffle ? "active" : ""}`}
                onClick={() => setShuffle(!shuffle)}
                title="Ngẫu nhiên"
              >
                <FaRandom />
              </button>
              <button className="ctrl-btn" onClick={playPrev}>
                <FaStepBackward />
              </button>
              <button className="ctrl-btn play-btn-large" onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="ctrl-btn" onClick={playNext}>
                <FaStepForward />
              </button>
              <button
                className={`ctrl-btn ${repeat !== "none" ? "active" : ""}`}
                onClick={handleRepeat}
                title={
                  repeat === "none" ? "Không lặp"  :
                  repeat === "all"  ? "Lặp tất cả" : "Lặp 1 bài"
                }
              >
                <FaRedo />
                {repeat === "one" && <span className="repeat-one">1</span>}
              </button>
            </div>

            {/* ===== ICON DANH SÁCH ===== */}
            <button
              className={`queue-icon-btn ${showQueue ? "active" : ""}`}
              onClick={handleToggleQueue}
              title={showQueue ? "Đóng danh sách" : "Danh sách"}
            >
              <FaListUl />
            </button>

          </div>
        </div>

        {/* ===== THANH COMPACT CHÍNH ===== */}
        <div className="player-bar">

          {/* Bên trái - info */}
          <div className="player-song-info">
            <div
              className="player-cover-small clickable"
              onClick={goToSongDetail}
              title="Xem chi tiết"
            >
              <img src={getCoverURL(currentSong)} alt={currentSong.title} />
              {isPlaying && (
                <div className="cover-playing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div className="cover-detail-overlay-small">
                <span>🔍</span>
              </div>
            </div>

            <div
              className="player-song-text clickable"
              onClick={goToSongDetail}
              title="Xem chi tiết"
            >
              <span className="player-song-name">{currentSong.title}</span>
              <span className="player-song-artist">{currentSong.artist}</span>
            </div>

            <button
              className={`fav-btn-player ${isFavorite(currentSong._id) ? "liked" : ""}`}
              onClick={() => toggleFavorite(currentSong._id)}
            >
              {isFavorite(currentSong._id) ? <FaHeart /> : <FaRegHeart />}
            </button>
          </div>

          {/* Giữa - controls + progress */}
          <div className="player-center">
            <div className="player-buttons">
              <button
                className={`ctrl-btn-sm ${shuffle ? "active" : ""}`}
                onClick={() => setShuffle(!shuffle)}
                title="Ngẫu nhiên"
              >
                <FaRandom />
              </button>
              <button className="ctrl-btn-sm" onClick={playPrev}>
                <FaStepBackward />
              </button>
              <button className="ctrl-btn-sm play-btn" onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button className="ctrl-btn-sm" onClick={playNext}>
                <FaStepForward />
              </button>
              <button
                className={`ctrl-btn-sm ${repeat !== "none" ? "active" : ""}`}
                onClick={handleRepeat}
                title={
                  repeat === "none" ? "Không lặp"  :
                  repeat === "all"  ? "Lặp tất cả" : "Lặp 1 bài"
                }
              >
                <FaRedo />
                {repeat === "one" && <span className="repeat-one">1</span>}
              </button>
            </div>

            <div className="player-progress">
              <span className="time">{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={handleProgressClick}>
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="progress-thumb"></div>
                </div>
              </div>
              <span className="time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Phải - expand */}
          <div className="player-right">
            <button
              className={`expand-btn ${expanded ? "is-expanded" : ""}`}
              onClick={() => {
                setExpanded(!expanded);
                if (expanded) setShowQueue(false);
              }}
            >
              {expanded ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>

        </div>
      </div>

      {/* ===== QUEUE PANEL ===== */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-header">

            {/* ✅ Label thay đổi theo source */}
            <h4>{getQueueLabel()}</h4>

            {/* ✅ Chỉ hiện nút refresh khi ở home */}
            {playSource === "home" && (
              <button
                className="queue-refresh-btn"
                onClick={generateRandomQueue}
                title="Làm mới danh sách"
              >
                <FaRandom />
              </button>
            )}
          </div>

          <div className="queue-list">
            {randomQueue.length === 0 ? (
              <div style={{ padding: "20px", color: "#888", textAlign: "center" }}>
                <p>Không có bài hát nào</p>
              </div>
            ) : (
              randomQueue.map((song, index) => {
                const isActive = currentSong._id === song._id;
                return (
                  <div
                    key={song._id}
                    className={`queue-item ${isActive ? "active" : ""}`}
                    onClick={() => playSong(song, playSource, currentQueue)}
                  >
                    {/* Index / playing bars */}
                    <div className="queue-index">
                      {isActive && isPlaying ? (
                        <div className="queue-playing-bars">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Cover */}
                    <img
                      src={getCoverURL(song)}
                      alt={song.title}
                      className="queue-cover"
                    />

                    {/* Info */}
                    <div className="queue-info">
                      <span className="queue-title">{song.title}</span>
                      <span className="queue-artist">{song.artist}</span>
                    </div>

                    {/* Fav */}
                    <button
                      className={`queue-fav-btn ${isFavorite(song._id) ? "liked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(song._id);
                      }}
                    >
                      {isFavorite(song._id) ? <FaHeart /> : <FaRegHeart />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default MusicPlayer;