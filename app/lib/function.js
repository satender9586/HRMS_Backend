const jwt = require("jsonwebtoken");

//-------------> CURRENT DATE GENERATE IN THIS FORMAT 2025-05-01

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


//-------------> ACCESS TOKEN GENERATE FUNCTION

const accessTokenGenerate = async (data) => {
  const token = await jwt.sign({ userId: data.user_id, email: data.email, role: data.role, status: data.status }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_SECRET_KEY_EXPIRY });
  return token;
};

//-------------> REFRESH TOKEN GENERATE FUNCTION

const refreshTokenGenerate = async (data) => {
  const token = await jwt.sign({ userId: data.user_id}, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_SECRET_KEY_EXPIRY });
  return token;
};

module.exports = { getCurrentDate, accessTokenGenerate,refreshTokenGenerate };
