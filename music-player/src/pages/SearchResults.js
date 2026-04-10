// src/pages/SearchResults.js
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import SongList from "../components/SongList";
import { useMusicContext } from "../context/MusicContext";
import "./SearchResults.css";

const SearchResults = () => {
  const [searchParams]          = useSearchParams();
  const query                   = searchParams.get("q") || "";
  const { songs, loading }      = useMusicContext();
  const [results, setResults]   = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const keyword = query.toLowerCase();
    const filtered = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(keyword) ||
        s.artist.toLowerCase().includes(keyword) ||
        s.album?.toLowerCase().includes(keyword)
    );
    setResults(filtered);
  }, [query, songs]);

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="search-results-loading">
          <p>🔄 Đang tìm kiếm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-page">

      {/* Header */}
      <div className="search-results-header">
        <FaSearch className="search-results-icon" />
        <div>
          <h2>Kết quả tìm kiếm</h2>
          <p>
            {results.length > 0
              ? `Tìm thấy ${results.length} kết quả cho "${query}"`
              : `Không tìm thấy kết quả nào cho "${query}"`
            }
          </p>
        </div>
      </div>

      {/* Kết quả */}
      {results.length > 0 ? (
        <SongList
          songs={results}
          title=""
          source="home"
          queue={results}
        />
      ) : (
        <div className="search-results-empty">
          <FaSearch />
          <p>Không tìm thấy bài hát nào</p>
          <span>Thử tìm với từ khóa khác nhé!</span>
        </div>
      )}
    </div>
  );
};

export default SearchResults;