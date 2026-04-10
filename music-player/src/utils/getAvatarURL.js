// src/utils/getAvatarURL.js
const BASE_URL = "http://localhost:5000";

const getAvatarURL = (avatar, size = 40) => {
  if (!avatar) return `https://i.pravatar.cc/${size}`;
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/uploads")) return `${BASE_URL}${avatar}`;
  return `https://i.pravatar.cc/${size}`;
};

export default getAvatarURL;