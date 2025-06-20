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

//-------------> FIND DIFFERENCE BETWEEEN DATES
 const getDiffInTwoDates = (start, end)=> {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const diffInDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))+1;
    return diffInDays;
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

//-------------> short data bases on array 

const shortDates = (data) => {
  return data.sort((a, b) => {
    const aDate = new Date(a.celebration_date);
    const bDate = new Date(b.celebration_date);
    const aMonthDay = (aDate.getMonth() + 1).toString().padStart(2, '0') +
                      aDate.getDate().toString().padStart(2, '0');
    const bMonthDay = (bDate.getMonth() + 1).toString().padStart(2, '0') +
                      bDate.getDate().toString().padStart(2, '0');
    return aMonthDay.localeCompare(bMonthDay);
  });
};


module.exports = { getCurrentDate,formatDate,generateAccessAndRefreshToken,getDiffInTwoDates,shortDates };
