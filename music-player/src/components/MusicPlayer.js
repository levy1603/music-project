// src/components/MusicPlayer.js
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay, FaPause,
  FaStepForward, FaStepBackward,
  FaRandom, FaRedo,
  FaHeart, FaRegHeart,
  FaChevronUp, FaChevronDown,
  FaListUl, FaClock,
} from "react-icons/fa";
import { useMusicContext }  from "../context/MusicContext";
import {
  setFaviconWithStatus,
  resetFavicon,
  setPageTitle,
} from "../utils/dynamicFavicon";
import useSleepTimer   from "../hooks/useSleepTimer";
import SleepTimerPanel from "./SleepTimerPanel";
import "./MusicPlayer.css";

const MusicPlayer = () => {
  const {
    currentSong, isPlaying, currentTime, duration,
    repeat, shuffle, songs,
    playSource, currentQueue,
    togglePlay, playNext, playPrev, seekTo,
    setRepeat, setShuffle, toggleFavorite, isFavorite,
    getCoverURL, playSong,
  } = useMusicContext();

  const [expanded,    setExpanded]    = useState(false);
  const [showQueue,   setShowQueue]   = useState(false);
  const [randomQueue, setRandomQueue] = useState([]);
  const navigate  = useNavigate();
  const playerRef = useRef(null);

  // ✅ Ref tránh stale closure
  const isPlayingRef  = useRef(isPlaying);
  const togglePlayRef = useRef(togglePlay);

  useEffect(() => { isPlayingRef.current  = isPlaying;  }, [isPlaying]);
  useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);

  // ✅ Sleep Timer
  const {
    timerActive,
    timerMinutes,
    timeRemaining,
    showTimerPanel,
    formatRemaining,
    setTimerMinutes,
    setShowTimerPanel,
    startTimer,
    stopTimer,
  } = useSleepTimer(() => {
    if (isPlayingRef.current) togglePlayRef.current();
  });

  // ===== CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (playerRef.current && !playerRef.current.contains(e.target)) {
        setExpanded(false);
        setShowQueue(false);
        setShowTimerPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== QUEUE =====
  useEffect(() => {
    if (showQueue) generateRandomQueue();
    // eslint-disable-next-line
  }, [playSource, currentQueue]);

  // ===== FAVICON + TITLE =====
  useEffect(() => {
    if (!currentSong) {
      resetFavicon();
      document.title = "ChillWithF 🎵";
      return;
    }
    const coverUrl = getCoverURL(currentSong);
    setFaviconWithStatus(coverUrl, isPlaying);
    setPageTitle(currentSong.title, currentSong.artist, isPlaying);
  }, [currentSong?._id, isPlaying]);

  // ===== HELPERS =====
  const getQueueLabel = () => {
    switch (playSource) {
      case "favorites": return "❤️ Từ yêu thích";
      case "playlist":  return "🎵 Từ playlist";
      default:          return "🎲 Gợi ý ngẫu nhiên";
    }
  };

  const generateRandomQueue = () => {
    if (playSource === "home") {
      const shuffled = [...songs]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(20, songs.length));
      setRandomQueue(shuffled);
    } else {
      setRandomQueue(currentQueue);
    }
  };

  const handleToggleQueue = () => {
    if (!showQueue) generateRandomQueue();
    setShowQueue(!showQueue);
    setShowTimerPanel(false); // ✅ Đóng timer khi mở queue
  };

  const handleToggleTimer = () => {
    setShowTimerPanel(!showTimerPanel);
    setShowQueue(false); // ✅ Đóng queue khi mở timer
  };

  const goToSongDetail = () => {
    if (currentSong?._id) navigate(`/song/${currentSong._id}`);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e) => {
    const rect    = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleRepeat = () => {
    const modes = ["none", "all", "one"];
    setRepeat(modes[(modes.indexOf(repeat) + 1) % modes.length]);
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
                  repeat === "none" ? "Không lặp" :
                  repeat === "all"  ? "Lặp tất cả" : "Lặp 1 bài"
                }
              >
                <FaRedo />
                {repeat === "one" && <span className="repeat-one">1</span>}
              </button>
            </div>

            {/* ===== HÀNG DƯỚI: Queue + Timer ===== */}
            <div className="player-expanded-bottom">

              {/* Nút danh sách */}
              <button
                className={`queue-icon-btn ${showQueue ? "active" : ""}`}
                onClick={handleToggleQueue}
                title={showQueue ? "Đóng danh sách" : "Xem danh sách"}
              >
                <FaListUl />
              </button>

              {/* Nút hẹn giờ */}
              <button
                className={`timer-icon-btn ${timerActive ? "timer-active" : ""} ${showTimerPanel ? "timer-open" : ""}`}
                onClick={handleToggleTimer}
                title={timerActive
                  ? `Hẹn giờ: còn ${formatRemaining(timeRemaining)}`
                  : "Hẹn giờ tắt nhạc"
                }
              >
                <FaClock />
                {timerActive && (
                  <span className="timer-badge">
                    {formatRemaining(timeRemaining)}
                  </span>
                )}
              </button>

            </div>

          </div>
        </div>

        {/* ===== THANH COMPACT CHÍNH ===== */}
        <div className="player-bar">

          {/* Trái */}
          <div className="player-song-info">
            <div
              className="player-cover-small clickable"
              onClick={goToSongDetail}
              title="Xem chi tiết"
            >
              <img src={getCoverURL(currentSong)} alt={currentSong.title} />
              {isPlaying && (
                <div className="cover-playing-indicator">
                  <span></span><span></span><span></span>
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

          {/* Giữa */}
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
                  repeat === "none" ? "Không lặp" :
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

          {/* Phải */}
          <div className="player-right">
            {/* Badge khi chưa expand */}
            {timerActive && !expanded && (
              <div
                className="timer-compact-badge"
                onClick={() => {
                  setExpanded(true);
                  setShowTimerPanel(true);
                }}
                title="Hẹn giờ đang chạy"
              >
                <FaClock />
                <span>{formatRemaining(timeRemaining)}</span>
              </div>
            )}

            <button
              className={`expand-btn ${expanded ? "is-expanded" : ""}`}
              onClick={() => {
                setExpanded(!expanded);
                if (expanded) {
                  setShowQueue(false);
                  setShowTimerPanel(false);
                }
              }}
            >
              {expanded ? <FaChevronDown /> : <FaChevronUp />}
            </button>
          </div>

        </div>
      </div>

      {/* ===== QUEUE PANEL - bên phải player ===== */}
      {showQueue && (
        <div className="queue-panel">
          <div className="queue-header">
            <h4>{getQueueLabel()}</h4>
            {playSource === "home" && (
              <button
                className="queue-refresh-btn"
                onClick={generateRandomQueue}
                title="Làm mới"
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
                    <div className="queue-index">
                      {isActive && isPlaying ? (
                        <div className="queue-playing-bars">
                          <span></span><span></span><span></span>
                        </div>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <img
                      src={getCoverURL(song)}
                      alt={song.title}
                      className="queue-cover"
                    />
                    <div className="queue-info">
                      <span className="queue-title">{song.title}</span>
                      <span className="queue-artist">{song.artist}</span>
                    </div>
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

      {/* ✅ TIMER PANEL - bên phải player, giống queue panel */}
      {showTimerPanel && (
        <div className="timer-panel">
          <SleepTimerPanel
            timerActive={timerActive}
            timerMinutes={timerMinutes}
            timeRemaining={timeRemaining}
            formatRemaining={formatRemaining}
            onSetMinutes={setTimerMinutes}
            onStart={startTimer}
            onStop={stopTimer}
            onClose={() => setShowTimerPanel(false)}
          />
        </div>
      )}

    </div>
  );
};

export default MusicPlayer;