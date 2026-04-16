import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/"              : "ChillWithF  - Trang chủ",
  "/search"        : "ChillWithF  - Tìm kiếm",
  "/upload"        : "ChillWithF  - Upload nhạc",
  "/profile"       : "ChillWithF  - Hồ sơ của tôi",
  "/favorites"     : "ChillWithF  - Yêu thích",
  "/playlist"      : "ChillWithF  - Playlist",
  "/my-playlists"  : "ChillWithF  - Playlist của tôi",
  "/notifications" : "ChillWithF  - Thông báo",
  "/login"         : "ChillWithF  - Đăng nhập",
  "/register"      : "ChillWithF  - Đăng ký",
  "/admin"         : "ChillWithF  - Quản trị",
};

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/song/")) {
      document.title = "ChillWithF  - Chi tiết bài hát";
      return;
    }

    const title = pageTitles[location.pathname] || "ChillWithF ";
    document.title = title;
  }, [location.pathname]);
};

export default usePageTitle;