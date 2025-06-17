const jwt = require("jsonwebtoken");
const { promisePool } = require("../config/dbConnected");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const accessToken =
      req.cookies?.accessToken ||
      (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing."
      });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY);

    const [user] = await promisePool.query(
      'SELECT * FROM employees WHERE employee_id = ?',
      [decoded?.employee_id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user[0];
    next();

  } catch (error) {
    console.error("JWT verification failed:", error);

    const isExpired = error.name === "TokenExpiredError";

    return res.status(401).json({
      success: false,
      message: isExpired
        ? "Token has expired, please login again"
        : "Invalid or expired token"
    });
  }
};

module.exports = { verifyToken };
