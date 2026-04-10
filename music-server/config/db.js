// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔄 Đang kết nối MongoDB Atlas...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout 10 giây
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    throw error; // Ném lỗi lên server.js xử lý
  }
};

module.exports = connectDB;