const jwt = require("jsonwebtoken");
const { promisePool } = require("../config/dbConnected");

const verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({ error: "Access denied. Token missing." });
    }
   
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);
  
    const [user] = await promisePool.query('SELECT * FROM employees WHERE user_id = ?', [decoded?.userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user[0];
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { verifyToken };
