// src/context/MusicContext.js
import { createContext, useContext, useState, useRef, useEffect } from "react";
import songAPI from "../api/songAPI";
import userAPI from "../api/userAPI";
import { useAuth } from "./AuthContext";

const MusicContext = createContext();
export const useMusicContext = () => useContext(MusicContext);

const BASE_URL = "http://localhost:5000";

export const MusicProvider = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();

  const [songs, setSongs]                     = useState([]);
  const [favoriteSongIds, setFavoriteSongIds] = useState([]);
  const [currentSong, setCurrentSong]         = useState(null);
  const [isPlaying, setIsPlaying]             = useState(false);
  const [currentTime, setCurrentTime]         = useState(0);
  const [duration, setDuration]               = useState(0);
  const [volume, setVolume]                   = useState(0.7);
  const [repeat, setRepeat]                   = useState("none");
  const [shuffle, setShuffle]                 = useState(false);
  const [searchTerm, setSearchTerm]           = useState("");
  const [loading, setLoading]                 = useState(false);
  const [playSource, setPlaySource]           = useState("home");
  const [currentQueue, setCurrentQueue]       = useState([]);
  const [listenedSongIds, setListenedSongIds] = useState([]);

  useEffect(() => {
    if (!user?._id) {
      setListenedSongIds([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`listened_${user._id}`);
      setListenedSongIds(saved ? JSON.parse(saved) : []);
    } catch {
      setListenedSongIds([]);
    }
  }, [user?._id]);

  const addToListened = (songId) => {
    if (!user?._id) return;
    setListenedSongIds((prev) => {
      const filtered = prev.filter((id) => id !== songId);
      const next = [songId, ...filtered];
      localStorage.setItem(`listened_${user._id}`, JSON.stringify(next));
      return next;
    });
  };

  const clearListened = () => {
    if (!user?._id) return;
    localStorage.removeItem(`listened_${user._id}`);
    setListenedSongIds([]);
  };

  const audioRef = useRef(new Audio());

  useEffect(() => { fetchSongs(); }, []);

  useEffect(() => {
    if (isAuthenticated) fetchFavorites();
    else setFavoriteSongIds([]);
  }, [isAuthenticated]);

  // ✅ THÊM: Đổi title theo bài đang phát
  useEffect(() => {
    if (currentSong && isPlaying) {
      document.title = ` ${currentSong.title} — ${currentSong.artist} | ChillWithF `;
    } else if (currentSong && !isPlaying) {
      document.title = ` ${currentSong.title} — ${currentSong.artist} | ChillWithF `;
    } else {
      // Không có bài nào → giữ title mặc định (usePageTitle sẽ xử lý)
      document.title = "ChillWithF ";
    }
  }, [currentSong, isPlaying]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await songAPI.getAll();
      setSongs(res.data);
    } catch (error) {
      console.error("Lỗi lấy bài hát:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await userAPI.getFavorites();
      const ids = res.data.data
        ? res.data.data.map((song) => song._id)
        : res.data.map((song) => song._id);
      setFavoriteSongIds(ids);
      updateUser({ favoriteCount: ids.length });
    } catch (error) {
      console.error("Lỗi lấy yêu thích:", error);
    }
  };

  useEffect(() => {
    if (currentSong) {
      if (!currentSong.audioFile) {
        console.warn("Bài hát này không có audioFile!");
        return;
      }

      const audioURL = currentSong.audioFile.startsWith("http")
        ? currentSong.audioFile
        : `${BASE_URL}/uploads/songs/${currentSong.audioFile}`;

      audioRef.current.src    = audioURL;
      audioRef.current.volume = volume;

      if (isPlaying) {
        audioRef.current.play().catch((e) => console.log(e));
      }

      songAPI.play(currentSong._id).catch(() => {});
    }
    // eslint-disable-next-line
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;

    const updateTime     = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded    = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };

    audio.addEventListener("timeupdate",     updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended",          handleEnded);

    return () => {
      audio.removeEventListener("timeupdate",     updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended",          handleEnded);
    };
    // eslint-disable-next-line
  }, [repeat, shuffle, currentSong, currentQueue]);

  const togglePlay = () => {
    if (!currentSong && songs.length > 0) {
      playSong(songs[0], "home", songs);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.log(e));
    }
    setIsPlaying(!isPlaying);
  };

  const playSong = (song, source = null, queue = null) => {
    setCurrentSong(song);
    setIsPlaying(true);
    addToListened(song._id);
    if (source) setPlaySource(source);
    if (queue)  setCurrentQueue(queue);
  };

  const playNext = () => {
    if (!currentSong || currentQueue.length === 0) return;
    const currentIndex = currentQueue.findIndex((s) => s._id === currentSong._id);

    if (shuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * currentQueue.length);
      } while (randomIndex === currentIndex && currentQueue.length > 1);
      playSong(currentQueue[randomIndex]);
    } else {
      const nextIndex = (currentIndex + 1) % currentQueue.length;
      if (nextIndex === 0 && repeat === "none") {
        setIsPlaying(false);
        return;
      }
      playSong(currentQueue[nextIndex]);
    }
  };

  const playPrev = () => {
    if (!currentSong || currentQueue.length === 0) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = currentQueue.findIndex((s) => s._id === currentSong._id);
    const prevIndex    = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    playSong(currentQueue[prevIndex]);
  };

  const seekTo = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  };

  const toggleFavorite = async (songId) => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thích bài hát!");
      return;
    }
    try {
      const res = await songAPI.like(songId);
      if (res.data.isLiked) {
        setFavoriteSongIds((prev) => {
          const newIds = [...prev, songId];
          updateUser({ favoriteCount: newIds.length });
          return newIds;
        });
      } else {
        setFavoriteSongIds((prev) => {
          const newIds = prev.filter((id) => id !== songId);
          updateUser({ favoriteCount: newIds.length });
          return newIds;
        });
      }
    } catch (error) {
      console.error("Lỗi thích bài hát:", error);
    }
  };

  const isFavorite = (songId) => favoriteSongIds.includes(songId);

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCoverURL = (song) => {
    if (!song || !song.coverImage) return "/default-cover.jpg";
    if (song.coverImage.startsWith("http")) return song.coverImage;
    return `${BASE_URL}/uploads/covers/${song.coverImage}`;
  };

  const fetchSongsAfterUpload = async () => {
    await fetchSongs();
    if (user) {
      updateUser({ uploadCount: (user.uploadCount || 0) + 1 });
    }
  };

  const value = {
    songs,
    filteredSongs,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    repeat,
    shuffle,
    searchTerm,
    loading,
    favoriteSongIds,
    listenedSongIds,
    playSource,
    currentQueue,
    setSearchTerm,
    togglePlay,
    playSong,
    playNext,
    playPrev,
    seekTo,
    changeVolume,
    setRepeat,
    setShuffle,
    toggleFavorite,
    isFavorite,
    getCoverURL,
    fetchSongs,
    fetchSongsAfterUpload,
    clearListened,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};