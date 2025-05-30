const jwt = require("jsonwebtoken");
const { promisePool } = require("../config/dbConnected");

//-------------> CURRENT DATE GENERATE IN THIS FORMAT 2025-05-01

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

//-------------> FROMATED DATE >> 2025-04-30

const formatDate = (date) => {
  return date.toISOString().split('T')[0]; 
};

//-------------> ACCESS TOKEN GENERATE FUNCTION


const accessTokenGenerate = async (data) => {
  const token = await jwt.sign({ employee_id: data.employee_id, email: data.email, role: data.role, status: data.status }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_SECRET_KEY_EXPIRY });
  return token;
};

//-------------> REFRESH TOKEN GENERATE FUNCTION

const refreshTokenGenerate = async (data) => {
  const token = await jwt.sign({ employee_id:  data.employee_id}, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_SECRET_KEY_EXPIRY });
  return token;
};

//-------------> REFRESH TOKEN GENERATE FUNCTION

const generateAccessAndRefreshToken =  async (paramObj)=>{
  try {
      const accessToken = await accessTokenGenerate(paramObj)
      const refreshToken = await refreshTokenGenerate(paramObj)

      const [result] = await promisePool.query("UPDATE employees SET refreshToken = ? WHERE employee_id = ?",[refreshToken, paramObj.employee_id]);
      if (result.affectedRows === 0) {
        throw new Error({ success: false, message: 'User not found or token update failed' });
      }
      return {accessToken,refreshToken}
  } catch (error) {
      console.log("some thing is wrong! during generate accessToken and refeshToken", error)
  }
}

//-------------> REFRESH TOKEN GENERATE FUNCTION


module.exports = { getCurrentDate,formatDate,generateAccessAndRefreshToken };
