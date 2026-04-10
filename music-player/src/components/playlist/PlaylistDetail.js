// src/components/playlist/PlaylistDetail.js
import React from "react";
import {
  FaArrowLeft,
  FaPlay,
  FaEdit,
  FaTrash,
  FaLock,
  FaGlobe,
  FaMusic,
  FaTrashAlt,
} from "react-icons/fa";
import { useMusicContext } from "../../context/MusicContext";
import "./PlaylistDetail.css";

const PlaylistDetail = ({
  playlist,
  onBack,
  onEdit,
  onDelete,
  onRemoveSong,
}) => {
  const { playSong, getCoverURL } = useMusicContext();

  // ✅ Lấy ảnh bìa bài hát đầu tiên
  const getPlaylistCover = () => {
    const firstSong = playlist.songs?.[0];
    if (firstSong) {
      return getCoverURL(firstSong);
    }
    return "/images/default-playlist.jpg";
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="playlist-detail">

      {/* ===== HEADER ===== */}
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          <FaArrowLeft /> Quay lại
        </button>
      </div>

      {/* ===== THÔNG TIN PLAYLIST ===== */}
      <div className="detail-hero">

        {/* ✅ Dùng getPlaylistCover() */}
        <img
          src={getPlaylistCover()}
          alt={playlist.name}
          className="detail-cover"
          onError={(e) => {
            e.target.src = "/images/default-playlist.jpg";
          }}
        />

        <div className="detail-meta">
          <span className={`detail-badge ${playlist.isPublic ? "public" : "private"}`}>
            {playlist.isPublic ? (
              <><FaGlobe /> Công khai</>
            ) : (
              <><FaLock /> Riêng tư</>
            )}
          </span>

          <h2 className="detail-name">{playlist.name}</h2>

          {playlist.description && (
            <p className="detail-desc">{playlist.description}</p>
          )}

          <p className="detail-info">
            <FaMusic /> {playlist.songs?.length || 0} bài hát
          </p>

          {/* ===== ACTIONS ===== */}
          <div className="detail-actions">
            <button
              className="btn-play-all"
              onClick={() => {
                if (playlist.songs?.[0]) {
                  playSong(playlist.songs[0], "playlist", playlist.songs);
                }
              }}
              disabled={!playlist.songs?.length}
            >
              <FaPlay /> Phát tất cả
            </button>

            <button className="btn-edit" onClick={onEdit}>
              <FaEdit /> Chỉnh sửa
            </button>

            <button className="btn-delete" onClick={onDelete}>
              <FaTrash /> Xóa playlist
            </button>
          </div>
        </div>
      </div>

      {/* ===== DANH SÁCH BÀI HÁT ===== */}
      <div className="detail-songs">
        <h3>Danh sách bài hát</h3>

        {!playlist.songs?.length ? (
          <div className="detail-empty">
            <FaMusic />
            <p>Playlist này chưa có bài hát nào</p>
          </div>
        ) : (
          <table className="songs-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bài hát</th>
                <th>Nghệ sĩ</th>
                <th>Thời lượng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {playlist.songs.map((song, index) => (
                <tr
                  key={song._id}
                  className="song-row"
                  onClick={() => playSong(song, "playlist", playlist.songs)}
                >
                  <td className="song-index">{index + 1}</td>

                  <td className="song-title">
                    {/* ✅ Dùng getCoverURL */}
                    <img
                      src={getCoverURL(song)}
                      alt={song.title}
                      onError={(e) => {
                        e.target.src = "/images/default-cover.jpg";
                      }}
                    />
                    <span>{song.title}</span>
                  </td>

                  <td className="song-artist">{song.artist}</td>

                  <td className="song-duration">
                    {formatDuration(song.duration)}
                  </td>

                  <td className="song-remove">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSong(song._id);
                      }}
                      title="Xóa khỏi playlist"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;