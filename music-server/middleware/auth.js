// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getTokenFromHeader = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Ban chua dang nhap",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Nguoi dung khong ton tai",
      });
    }

    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Tai khoan cua ban da bi khoa",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token khong hop le",
    });
  }
};

const optionalProtect = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isBanned) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const admin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Ban khong co quyen thuc hien hanh dong nay",
    });
  }
  next();
};

module.exports = { protect, optionalProtect, admin };
