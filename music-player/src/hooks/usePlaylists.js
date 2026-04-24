import { useState, useEffect, useCallback, useRef } from "react";
import playlistAPI from "../api/playlistAPI";

const usePlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingSong, setRemovingSong] = useState(false);

  const [error, setError] = useState("");

  const latestDetailRequestId = useRef(0);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await playlistAPI.getAll();
      setPlaylists(response.data || []);

      return {
        success: true,
        data: response.data || [],
      };
    } catch (err) {
      console.error("Loi tai playlist:", err);
      const message = err.message || "Khong the tai playlist";
      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const selectPlaylist = useCallback((playlist) => {
    setSelectedPlaylist(playlist);
  }, []);

  const selectPlaylistById = useCallback(
    async (playlistId) => {
      const requestId = ++latestDetailRequestId.current;

      try {
        setLoadingDetail(true);
        setError("");

        const response = await playlistAPI.getById(playlistId);
        const playlistDetail = response.data;

        if (requestId !== latestDetailRequestId.current) {
          return {
            success: false,
            ignored: true,
          };
        }

        setSelectedPlaylist(playlistDetail);

        return {
          success: true,
          data: playlistDetail,
        };
      } catch (err) {
        if (requestId !== latestDetailRequestId.current) {
          return {
            success: false,
            ignored: true,
          };
        }

        const cachedPlaylist = playlists.find(
          (playlist) => playlist._id === playlistId
        );

        if (cachedPlaylist) {
          setSelectedPlaylist(cachedPlaylist);

          return {
            success: true,
            data: cachedPlaylist,
            fallback: true,
          };
        }

        console.error("Loi tai chi tiet playlist:", err);
        const message = err.message || "Khong the tai chi tiet playlist";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        if (requestId === latestDetailRequestId.current) {
          setLoadingDetail(false);
        }
      }
    },
    [playlists]
  );

  const clearSelectedPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
  }, []);

  const startCreatePlaylist = useCallback(() => {
    setEditingPlaylist(null);
  }, []);

  const startEditPlaylist = useCallback((playlist) => {
    setEditingPlaylist(playlist);
  }, []);

  const clearEditingPlaylist = useCallback(() => {
    setEditingPlaylist(null);
  }, []);

  const createPlaylist = useCallback(
    async (formData) => {
      try {
        setSaving(true);
        clearError();

        const response = await playlistAPI.create(formData);
        const newPlaylist = response.data;

        setPlaylists((prev) => [newPlaylist, ...prev]);

        return {
          success: true,
          data: newPlaylist,
          message: response.message,
        };
      } catch (err) {
        console.error("Loi tao playlist:", err);
        const message = err.message || "Khong the tao playlist";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSaving(false);
      }
    },
    [clearError]
  );

  const updatePlaylist = useCallback(
    async (playlistId, formData) => {
      try {
        setSaving(true);
        clearError();

        const response = await playlistAPI.update(playlistId, formData);
        const updatedPlaylist = response.data;

        setPlaylists((prev) =>
          prev.map((playlist) =>
            playlist._id === playlistId ? updatedPlaylist : playlist
          )
        );

        setSelectedPlaylist((prev) => {
          if (!prev || prev._id !== playlistId) return prev;

          return {
            ...prev,
            ...updatedPlaylist,
            songs: prev.songs || [],
          };
        });

        setEditingPlaylist((prev) => {
          if (!prev || prev._id !== playlistId) return prev;

          return {
            ...prev,
            ...updatedPlaylist,
          };
        });

        return {
          success: true,
          data: updatedPlaylist,
          message: response.message,
        };
      } catch (err) {
        console.error("Loi cap nhat playlist:", err);
        const message = err.message || "Khong the cap nhat playlist";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setSaving(false);
      }
    },
    [clearError]
  );

  const savePlaylist = useCallback(
    async (formData) => {
      if (editingPlaylist?._id) {
        return updatePlaylist(editingPlaylist._id, formData);
      }

      return createPlaylist(formData);
    },
    [editingPlaylist, updatePlaylist, createPlaylist]
  );

  const deletePlaylist = useCallback(
    async (playlistId) => {
      try {
        setDeleting(true);
        clearError();

        const response = await playlistAPI.remove(playlistId);

        setPlaylists((prev) =>
          prev.filter((playlist) => playlist._id !== playlistId)
        );

        setSelectedPlaylist((prev) =>
          prev?._id === playlistId ? null : prev
        );

        setEditingPlaylist((prev) =>
          prev?._id === playlistId ? null : prev
        );

        return {
          success: true,
          message: response.message,
        };
      } catch (err) {
        console.error("Loi xoa playlist:", err);
        const message = err.message || "Khong the xoa playlist";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setDeleting(false);
      }
    },
    [clearError]
  );

  const removeSongFromPlaylist = useCallback(
    async (playlistId, songId) => {
      try {
        setRemovingSong(true);
        clearError();

        const response = await playlistAPI.removeSong(playlistId, songId);

        setSelectedPlaylist((prev) => {
          if (!prev || prev._id !== playlistId) return prev;

          return {
            ...prev,
            songs: prev.songs?.filter((song) => song._id !== songId) || [],
          };
        });

        await fetchPlaylists();

        return {
          success: true,
          message: response.message,
        };
      } catch (err) {
        console.error("Loi xoa bai hat khoi playlist:", err);
        const message =
          err.message || "Khong the xoa bai hat khoi playlist";
        setError(message);

        return {
          success: false,
          error: message,
        };
      } finally {
        setRemovingSong(false);
      }
    },
    [clearError, fetchPlaylists]
  );

  return {
    playlists,
    selectedPlaylist,
    editingPlaylist,

    loading,
    loadingDetail,
    saving,
    deleting,
    removingSong,

    error,

    fetchPlaylists,
    clearError,

    selectPlaylist,
    selectPlaylistById,
    clearSelectedPlaylist,

    startCreatePlaylist,
    startEditPlaylist,
    clearEditingPlaylist,

    savePlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeSongFromPlaylist,
  };
};

export default usePlaylists;
