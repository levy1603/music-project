// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MusicProvider } from "./context/MusicContext";
import Header from "./components/header/index";
import Sidebar from "./components/Sidebar";
import MusicPlayer from "./components/MusicPlayer";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import Playlist from "./pages/Playlist";
import MyPlaylists from "./pages/MyPlaylists";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SongDetail from "./pages/SongDetail";
import ProfilePage from "./pages/ProfilePage";
import SearchResults from "./pages/SearchResults";
import AdminPage from "./pages/admin/AdminPage"; // ✅ Thêm
import "./App.css";

// ===== PRIVATE ROUTE =====
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        🔄 Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// ===== ADMIN ROUTE ===== ✅
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#888" }}>
        🔄 Đang kiểm tra...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to="/" />;

  return children;
};

// ===== MAIN LAYOUT =====
const MainLayout = ({ children }) => {
  return (
    <>
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
      <MusicPlayer />
    </>
  );
};

// ===== APP ROUTES =====
function AppRoutes() {
  return (
    <MusicProvider>
      <Routes>

        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ===== ROUTES CÓ LAYOUT ===== */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Home />
            </MainLayout>
          }
        />

        <Route
          path="/song/:id"
          element={
            <MainLayout>
              <SongDetail />
            </MainLayout>
          }
        />

        <Route
          path="/search"
          element={
            <MainLayout>
              <SearchResults />
            </MainLayout>
          }
        />

        {/* ===== PRIVATE ROUTES ===== */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <MainLayout>
                <Favorites />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/playlist"
          element={
            <PrivateRoute>
              <MainLayout>
                <Playlist />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/my-playlists"
          element={
            <PrivateRoute>
              <MainLayout>
                <MyPlaylists />
              </MainLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <MainLayout>
                <Upload />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* ===== ADMIN ROUTE ===== ✅ */}
        <Route
          path="/admin"
          element={
            <AdminRoute>

                <AdminPage />

            </AdminRoute>
          }
        />

        {/* ===== 404 - Không tìm thấy ===== */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </MusicProvider>
  );
}

// ===== APP =====
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;