// controllers/authController.js
const User = require("../models/User");
const Song = require("../models/Song"); // ✅ THÊM

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc tên người dùng đã tồn tại",
      });
    }
    const user = await User.create({ username, email, password });
    const token = user.getSignedToken();

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        _id      : user._id,
        username : user.username,
        email    : user.email,
        avatar   : user.avatar,
        nickname : user.nickname,
        bio      : user.bio,
        role     : user.role,
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
        message: "Vui lòng nhập email và mật khẩu",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }

    const token = user.getSignedToken();

    // ✅ Thêm count khi login
    const uploadCount   = await Song.countDocuments({ uploadedBy: user._id });
    const favoriteCount = user.favorites?.length || 0;

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        _id          : user._id,
        username     : user.username,
        email        : user.email,
        avatar       : user.avatar,
        nickname     : user.nickname,
        bio          : user.bio,
        role         : user.role,
        favorites    : user.favorites,
        uploadCount,   // ✅
        favoriteCount, // ✅
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Sửa getMe - thêm count + nickname + bio
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("favorites");

    // ✅ Đếm số bài đã upload
    const uploadCount   = await Song.countDocuments({ uploadedBy: req.user._id });
    const favoriteCount = user.favorites?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        uploadCount,   // ✅
        favoriteCount, // ✅
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
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedToken();
    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, changePassword };