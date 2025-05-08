const { promisePool } = require("../config/dbConnected.js");
const { generateAccessAndRefreshToken } = require("../lib/function.js");
const { ApiError } = require("../lib/apiError.js");
const { ApiResponse } = require("../lib/apiResponse.js");
const jwt = require("jsonwebtoken");

//-------------> NEW EMPLOYEE REGISTRATION CONTROLLER

const userRegister = async (req, res) => {
  const { email, password, role, department } = req.body;
  try {
    if (!email || !password || !role || !department) {
      const error = new ApiError(400,"All fields are required: email, password, role, department");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [userExists] = await promisePool.query(
      "SELECT * FROM employees WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      const error = new ApiError(400, "Email already exists!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [result] = await promisePool.query(
      "INSERT INTO employees (email, password, role, department) VALUES (?, ?, ?, ?)",
      [email, password, role, department]
    );

    if (result.affectedRows === 1) {
      const data = { id: result.insertId, email, role, department };
      const response = new ApiResponse(201,data,"User registered successfully!");
      return res.status(response.statusCode).json({
        success: response.success,
        message: response.message,
        data: response.data,
      });
    }

    const errors = new ApiError(500, "Failed to register user.");
    return res.status(errors.statusCode).json({
      success: false,
      message: errors.message,
      errors: errors.errors,
      data: errors.data,
    });
  } catch (error) {
    console.error("Error in register API:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

//-------------> LOGGED USER CONTROLLER

const loginApi = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "email is missing!" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "password is missing!" });
    }

    const checkUserExistsQuery = "SELECT * FROM employees WHERE email = ?";
    const [rows] = await promisePool.query(checkUserExistsQuery, [email]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const user = rows[0];
    if (user.password !== password) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong password!" });
    }

    if (user.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Inactive account, please contact Admin!",
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

    const options = {
      httpOnly: true,
      secure: true,
    };

    const userObj = {
      email: user.email,
      status: user.status,
      role: user.role,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ success: true, data: userObj, accessToken, refreshToken });

      
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong!", error });
  }
};

//-------------> LOGGED OUT CONTROLLER

const loggedOut = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const userId = req.user.user_id;

    const options = {
      httpOnly: true,
      secure: true,
    };

    res.clearCookie("refreshToken", options);

    await promisePool.query(
      "UPDATE employees SET refreshToken = NULL WHERE user_id = ?",
      [userId]
    );

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "An error occurred during logout",
    });
  }
};

// -------------> REFRESH TOKEN CONTROLLER
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized access or refresh token missing!" });
    }

    try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);

      const [userRows] = await promisePool.query("SELECT * FROM employees WHERE user_id = ?", [decodedToken.userId]);

      if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid refresh token!" });
      }

      const user = userRows[0]; 

     
      if (incomingRefreshToken !== user.refreshToken) {
        return res.status(404).json({ success: false, message: "Refresh token expired or used!" });
      }

      
      const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user);

     
      const options = {
        httpOnly: true,
        secure: true
      };

      
      const userObj = {
        email: user.email,
        status: user.status,
        role: user.role,
      };

      
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({ success: true, message: "New refresh token generated successfully!", data: userObj, accessToken, newRefreshToken });

    } catch (error) {
     
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Refresh token has expired. Please log in again.",
        });
      }

      
      return res.status(500).json({
        success: false,
        message: "Error verifying token",
      });
    }

  } catch (error) {
    console.error("Refresh Token error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during token refresh.",
    });
  }
};



module.exports = { userRegister, loginApi, loggedOut,refreshAccessToken };
