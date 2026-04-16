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
  const [isExpanded, setIsExpanded]       = useState(false);
  const [noResult, setNoResult]           = useState(false); // ✅ THÊM
  const navigate   = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef   = useRef(null);

  // ===== CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPanel(false);
        setIsExpanded(false); // ✅ Thu lại khi click ngoài
        setNoResult(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== LỌC GỢI Ý =====
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowPanel(false);
      setNoResult(false);
      return;
    }

    const keyword  = inputValue.toLowerCase();
    const filtered = songs
      .filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.artist.toLowerCase().includes(keyword)
      )
      .slice(0, 6);

    setSuggestions(filtered);
    setNoResult(filtered.length === 0); // ✅ Không có kết quả
    setShowPanel(true);
  }, [inputValue, songs]);

  // ===== HOVER =====
  const handleMouseEnter = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 250);
  };

  const handleMouseLeave = () => {
    // ✅ Thu lại ngay khi rời chuột nếu không có text và không focus
    if (!inputValue.trim()) {
      if (document.activeElement !== inputRef.current) {
        setIsExpanded(false);
        setShowPanel(false);
        setNoResult(false);
      }
    }
  };

  // ===== KEYBOARD =====
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      setShowPanel(false);
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
    if (e.key === "Escape") {
      setShowPanel(false);
      setInputValue("");
      setIsExpanded(false);
      setNoResult(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (song) => {
    setShowPanel(false);
    setInputValue("");
    setIsExpanded(false);
    setNoResult(false);
    playSong(song, "home", songs);
    navigate(`/song/${song._id}`);
  };

  const handleSearch = () => {
    if (inputValue.trim()) {
      setShowPanel(false);
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowPanel(false);
    setNoResult(false);
    inputRef.current?.focus();
  };

  const handleIconClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 250);
    } else {
      handleSearch();
    }
  };

  return (
    <div
      className="search-bar-wrapper"
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`
        search-bar
        ${isExpanded  ? "expanded"   : ""}
        ${showPanel   ? "panel-open" : ""}
      `}>

        {/* Icon */}
        <button className="search-icon-btn" onClick={handleIconClick}>
          <FaSearch />
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Tìm kiếm bài hát, nghệ sĩ..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsExpanded(true);
            if (suggestions.length > 0 || noResult) setShowPanel(true);
          }}
          onBlur={() => {
            // ✅ Thu lại sau blur nếu không có text
            setTimeout(() => {
              if (
                !inputValue.trim() &&
                !wrapperRef.current?.contains(document.activeElement)
              ) {
                setIsExpanded(false);
                setShowPanel(false);
                setNoResult(false);
              }
            }, 150);
          }}
          className="search-input"
        />

        {/* Clear */}
        {inputValue && isExpanded && (
          <button className="search-clear-btn" onClick={handleClear}>
            <FaTimes />
          </button>
        )}
      </div>

      {/* ===== PANEL ===== */}
      {showPanel && isExpanded && (
        <div className="search-panel">

          {/* ✅ Không có kết quả */}
          {noResult ? (
            <div className="search-no-result">
              <span className="search-no-result-icon">🔍</span>
              <p>Không tìm thấy kết quả cho</p>
              <strong>"{inputValue}"</strong>
            </div>
          ) : (
            <>
              <div className="search-panel-header">
                <span>Gợi ý</span>
                <button className="search-panel-all" onClick={handleSearch}>
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
                    <img
                      src={getCoverURL(song)}
                      alt={song.title}
                      className="suggestion-cover"
                      onError={(e) => { e.target.src = "/images/default-cover.jpg"; }}
                    />
                    <div className="suggestion-info">
                      <span className="suggestion-title">{song.title}</span>
                      <span className="suggestion-artist">{song.artist}</span>
                    </div>
                    <span className="suggestion-tag">Bài hát</span>
                  </li>
                ))}
              </ul>

              <div className="search-panel-footer">
                <span>Nhấn</span>
                <kbd>Enter</kbd>
                <span>để xem tất cả kết quả</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;