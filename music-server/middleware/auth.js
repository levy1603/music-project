// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Bảo vệ route - yêu cầu đăng nhập
const protect = async (req, res, next) => {
  let token;

  // Lấy token từ header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Bạn chưa đăng nhập",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user từ token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

// Kiểm tra quyền admin
const admin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thực hiện hành động này",
    });
  }
  next();
};

module.exports = { protect, admin };