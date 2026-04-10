// src/components/SearchBar.js
import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useMusicContext } from "../context/MusicContext";
import "./SearchBar.css";

const SearchBar = () => {
  const { songs, getCoverURL, playSong }  = useMusicContext();
  const [inputValue, setInputValue]       = useState("");
  const [showPanel, setShowPanel]         = useState(false);
  const [suggestions, setSuggestions]     = useState([]);
  const navigate  = useNavigate();
  const wrapperRef = useRef(null);

  // ===== CLICK OUTSIDE → ĐÓNG PANEL =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== LỌC GỢI Ý KHI GÕ =====
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowPanel(false);
      return;
    }

    const keyword = inputValue.toLowerCase();
    const filtered = songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.artist.toLowerCase().includes(keyword)
      )
      .slice(0, 6); // Chỉ hiện tối đa 6 gợi ý

    setSuggestions(filtered);
    setShowPanel(true);
  }, [inputValue, songs]);

  // ===== ENTER → NAVIGATE ĐẾN TRANG KẾT QUẢ =====
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      setShowPanel(false);
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
    if (e.key === "Escape") {
      setShowPanel(false);
      setInputValue("");
    }
  };

  // ===== CLICK VÀO GỢI Ý → PHÁT NHẠC =====
  const handleSuggestionClick = (song) => {
    setShowPanel(false);
    setInputValue("");
    playSong(song, "home", songs);
    navigate(`/song/${song._id}`);
  };

  // ===== CLICK NÚT TÌM KIẾM =====
  const handleSearch = () => {
    if (inputValue.trim()) {
      setShowPanel(false);
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  // ===== XÓA INPUT =====
  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowPanel(false);
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className={`search-bar ${showPanel ? "active" : ""}`}>

        {/* Icon tìm kiếm */}
        <button className="search-icon-btn" onClick={handleSearch}>
          <FaSearch />
        </button>

        {/* Input */}
        <input
          type="text"
          placeholder="Tìm kiếm bài hát, nghệ sĩ..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowPanel(true)}
        />

        {/* Nút xóa */}
        {inputValue && (
          <button className="search-clear-btn" onClick={handleClear}>
            <FaTimes />
          </button>
        )}
      </div>

      {/* ===== PANEL GỢI Ý ===== */}
      {showPanel && suggestions.length > 0 && (
        <div className="search-panel">

          <div className="search-panel-header">
            <span>Gợi ý</span>
            <button
              className="search-panel-all"
              onClick={handleSearch}
            >
              Xem tất cả kết quả
            </button>
          </div>

          <ul className="search-suggestions">
            {suggestions.map((song) => (
              <li
                key={song._id}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(song)}
              >
                {/* Ảnh */}
                <img
                  src={getCoverURL(song)}
                  alt={song.title}
                  className="suggestion-cover"
                  onError={(e) => { e.target.src = "/images/default-cover.jpg"; }}
                />

                {/* Info */}
                <div className="suggestion-info">
                  <span className="suggestion-title">{song.title}</span>
                  <span className="suggestion-artist">{song.artist}</span>
                </div>

                {/* Tag */}
                <span className="suggestion-tag">Bài hát</span>
              </li>
            ))}
          </ul>

          {/* Gợi ý enter */}
          <div className="search-panel-footer">
            <span>Nhấn</span>
            <kbd>Enter</kbd>
            <span>để xem tất cả kết quả</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;