// controllers/authController.js
const User = require("../models/User");
const Song = require("../models/Song");

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoac ten nguoi dung da ton tai",
      });
    }

    const user = await User.create({ username, email, password });
    const token = user.getSignedToken();

    res.status(201).json({
      success: true,
      message: "Dang ky thanh cong",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        nickname: user.nickname,
        bio: user.bio,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui long nhap email va mat khau",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong dung",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoac mat khau khong dung",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Tai khoan cua ban da bi khoa",
      });
    }

    const token = user.getSignedToken();
    const uploadCount = await Song.countDocuments({ uploadedBy: user._id });
    const favoriteCount = user.favorites?.length || 0;

    res.status(200).json({
      success: true,
      message: "Dang nhap thanh cong",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        nickname: user.nickname,
        bio: user.bio,
        role: user.role,
        favorites: user.favorites,
        uploadCount,
        favoriteCount,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("favorites");

    const uploadCount = await Song.countDocuments({ uploadedBy: req.user._id });
    const favoriteCount = user.favorites?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        uploadCount,
        favoriteCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mat khau hien tai khong dung",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedToken();
    res.status(200).json({
      success: true,
      message: "Doi mat khau thanh cong",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, changePassword };
