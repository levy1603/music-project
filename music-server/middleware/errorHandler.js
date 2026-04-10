// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy dữ liệu",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File quá lớn",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Lỗi server",
  });
};

module.exports = errorHandler;