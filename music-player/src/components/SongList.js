// src/components/SongList.js
import React from "react";
import { FaClock } from "react-icons/fa";
import SongItem from "./SongItem";
import "./SongList.css";

const SongList = ({ songs, title, source = "home", queue = [] }) => { // ✅ Thêm props
  return (
    <div className="song-list">
      <h2 className="song-list-title">{title}</h2>

      <div className="song-list-header">
        <div className="col-index">#</div>
        <div className="col-cover"></div>
        <div className="col-title">BÀI HÁT</div>
        <div className="col-duration"><FaClock /></div>
        <div className="col-album">ALBUM</div>
        <div className="col-plays">LƯỢT NGHE</div>
        <div className="col-actions"></div>
      </div>

      <div className="song-list-body">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <SongItem
              key={song._id}
              song={song}
              index={index}
              source={source}  // ✅ Truyền xuống
              queue={queue}    // ✅ Truyền xuống
            />
          ))
        ) : (
          <div className="no-songs">
            <p>Không tìm thấy bài hát nào 😢</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongList;