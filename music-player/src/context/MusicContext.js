import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import songAPI from "../api/songAPI";
import userAPI from "../api/userAPI";
import { useAuth } from "./AuthContext";

const MusicContext = createContext();

export const useMusicContext = () => useContext(MusicContext);

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const MAX_RECENT_ITEMS = 10;
const SONGS_PAGE_SIZE = 100;

export const MusicProvider = ({ children }) => {
  const { user, isAuthenticated, updateUser } = useAuth();

  const [songs, setSongs] = useState([]);
  const [favoriteSongIds, setFavoriteSongIds] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [repeat, setRepeat] = useState("none");
  const [shuffle, setShuffle] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [playSource, setPlaySource] = useState("home");
  const [currentQueue, setCurrentQueue] = useState([]);
  const [listenedSongIds, setListenedSongIds] = useState([]);

  const audioRef = useRef(new Audio());

  const getListenedStorageKey = useCallback(() => {
    return user?._id ? `listened_${user._id}` : null;
  }, [user?._id]);

  /* ═══════════════════════════════════════
     LOAD LISTENED HISTORY
  ═══════════════════════════════════════ */
  useEffect(() => {
    const storageKey = getListenedStorageKey();

    if (!storageKey) {
      setListenedSongIds([]);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setListenedSongIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setListenedSongIds([]);
    }
  }, [getListenedStorageKey]);

  /* ═══════════════════════════════════════
     FETCH SONGS / FAVORITES
  ═══════════════════════════════════════ */
  const fetchSongs = useCallback(async () => {
    try {
      setLoading(true);
      let page = 1;
      let totalPages = 1;
      const allSongs = [];

      do {
        const res = await songAPI.getAll({
          page,
          limit: SONGS_PAGE_SIZE,
        });
        const pageSongs = Array.isArray(res?.data) ? res.data : [];

        allSongs.push(...pageSongs);
        totalPages = Number(res?.totalPages) || 1;
        page += 1;
      } while (page <= totalPages);

      setSongs(allSongs);
    } catch (error) {
      console.error("Lỗi lấy bài hát:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await userAPI.getFavorites();
      const rawData = res.data?.data || res.data || [];
      const ids = Array.isArray(rawData) ? rawData.map((song) => song._id) : [];

      setFavoriteSongIds(ids);
      updateUser({ favoriteCount: ids.length });
    } catch (error) {
      console.error("Lỗi lấy yêu thích:", error);
    }
  }, [updateUser]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavoriteSongIds([]);
    }
  }, [isAuthenticated, fetchFavorites]);

  /* ═══════════════════════════════════════
     DOCUMENT TITLE
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (currentSong) {
      document.title = `${currentSong.title} — ${currentSong.artist} | ChillWithF`;
    } else {
      document.title = "ChillWithF";
    }
  }, [currentSong]);

  /* ═══════════════════════════════════════
     AUDIO SOURCE
  ═══════════════════════════════════════ */
  useEffect(() => {
    if (!currentSong) return;

    if (!currentSong.audioFile) {
      console.warn("Bài hát này không có audioFile!");
      return;
    }

    const audioURL = currentSong.audioFile.startsWith("http")
      ? currentSong.audioFile
      : `${BASE_URL}/uploads/songs/${currentSong.audioFile}`;

    if (audioRef.current.src !== audioURL) {
      audioRef.current.src = audioURL;
      audioRef.current.load();
    }

    setCurrentTime(0);
    setDuration(0);
    songAPI.play(currentSong._id).catch(() => {});
  }, [currentSong]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!currentSong || !audioRef.current.src) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => console.log(error));
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  /* ═══════════════════════════════════════
     AUDIO EVENTS
  ═══════════════════════════════════════ */
  useEffect(() => {
    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    const handleEnded = () => {
      if (repeat === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else {
        playNext();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeat, shuffle, currentSong, currentQueue]);

  /* ═══════════════════════════════════════
     LISTENED / RECENTLY PLAYED
  ═══════════════════════════════════════ */
  const addToListened = useCallback(
    (songId) => {
      const storageKey = getListenedStorageKey();
      if (!storageKey || !songId) return;

      setListenedSongIds((prev) => {
        const filtered = prev.filter((id) => id !== songId);
        const next = [songId, ...filtered].slice(0, MAX_RECENT_ITEMS);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [getListenedStorageKey],
  );

  const clearListened = useCallback(() => {
    const storageKey = getListenedStorageKey();
    if (!storageKey) return;

    localStorage.removeItem(storageKey);
    setListenedSongIds([]);
  }, [getListenedStorageKey]);

  const recentlyPlayedSongs = useMemo(() => {
    if (!Array.isArray(listenedSongIds) || listenedSongIds.length === 0)
      return [];

    return listenedSongIds
      .map((songId) => songs.find((song) => song._id === songId))
      .filter(Boolean);
  }, [listenedSongIds, songs]);

  /* ═══════════════════════════════════════
     PLAYER CONTROLS
  ═══════════════════════════════════════ */
  const togglePlay = useCallback(() => {
    if (!currentSong && songs.length > 0) {
      const defaultQueue = songs;
      const firstSong = songs[0];
      setCurrentSong(firstSong);
      setPlaySource("home");
      setCurrentQueue(defaultQueue);
      setIsPlaying(true);
      addToListened(firstSong._id);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => console.log(error));
    }

    setIsPlaying((prev) => !prev);
  }, [currentSong, songs, isPlaying, addToListened]);

  const playSong = useCallback(
    (song, source = null, queue = null) => {
      if (!song) return;

      setCurrentSong(song);
      setIsPlaying(true);
      addToListened(song._id);

      if (source) setPlaySource(source);
      if (queue) setCurrentQueue(queue);
    },
    [addToListened],
  );

  const playNext = useCallback(() => {
    if (!currentSong || currentQueue.length === 0) return;

    const currentIndex = currentQueue.findIndex(
      (song) => song._id === currentSong._id,
    );

    if (shuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * currentQueue.length);
      } while (randomIndex === currentIndex && currentQueue.length > 1);

      const nextSong = currentQueue[randomIndex];
      if (nextSong) {
        playSong(nextSong, playSource, currentQueue);
      }
      return;
    }

    const nextIndex = (currentIndex + 1) % currentQueue.length;

    if (nextIndex === 0 && repeat === "none") {
      setIsPlaying(false);
      return;
    }

    const nextSong = currentQueue[nextIndex];
    if (nextSong) {
      playSong(nextSong, playSource, currentQueue);
    }
  }, [currentSong, currentQueue, shuffle, repeat, playSong, playSource]);

  const playPrev = useCallback(() => {
    if (!currentSong || currentQueue.length === 0) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIndex = currentQueue.findIndex(
      (song) => song._id === currentSong._id,
    );

    const prevIndex =
      (currentIndex - 1 + currentQueue.length) % currentQueue.length;

    const prevSong = currentQueue[prevIndex];
    if (prevSong) {
      playSong(prevSong, playSource, currentQueue);
    }
  }, [currentSong, currentQueue, playSong, playSource]);

  const seekTo = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const changeVolume = useCallback((vol) => {
    setVolume(vol);
    audioRef.current.volume = vol;
  }, []);

  /* ═══════════════════════════════════════
     FAVORITES
  ═══════════════════════════════════════ */
  const toggleFavorite = useCallback(
    async (songId) => {
      if (!isAuthenticated) {
        return {
          success: false,
          requiresAuth: true,
          message: "Vui lòng đăng nhập để thích bài hát!",
        };
      }

      try {
        const res = await songAPI.like(songId);
        const isLiked = !!res?.data?.isLiked;

        if (isLiked) {
          setFavoriteSongIds((prev) => {
            const next = prev.includes(songId) ? prev : [...prev, songId];
            updateUser({ favoriteCount: next.length });
            return next;
          });
        } else {
          setFavoriteSongIds((prev) => {
            const next = prev.filter((id) => id !== songId);
            updateUser({ favoriteCount: next.length });
            return next;
          });
        }

        return {
          success: true,
          isLiked,
        };
      } catch (error) {
        console.error("Lỗi thích bài hát:", error);

        return {
          success: false,
          requiresAuth: false,
          message: error?.message || "Không thể cập nhật yêu thích",
        };
      }
    },
    [isAuthenticated, updateUser],
  );

  const isFavorite = useCallback(
    (songId) => favoriteSongIds.includes(songId),
    [favoriteSongIds],
  );

  /* ═══════════════════════════════════════
     FILTERED SONGS
  ═══════════════════════════════════════ */
  const filteredSongs = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(keyword) ||
        song.artist?.toLowerCase().includes(keyword),
    );
  }, [songs, searchTerm]);

  const getCoverURL = useCallback((song) => {
    if (!song || !song.coverImage) return "/images/default-cover.jpg";
    if (song.coverImage.startsWith("http")) return song.coverImage;
    return `${BASE_URL}/uploads/covers/${song.coverImage}`;
  }, []);

  const fetchSongsAfterUpload = useCallback(async () => {
    await fetchSongs();

    if (user) {
      updateUser({ uploadCount: (user.uploadCount || 0) + 1 });
    }
  }, [fetchSongs, user, updateUser]);

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
    recentlyPlayedSongs,
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
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
};
