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
    if (!email || !password) {
      const error = new ApiError(
        400,
        "Both email and password are required"
      );
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const checkUserExistsQuery = "SELECT * FROM employees WHERE email = ?";
    const [rows] = await promisePool.query(checkUserExistsQuery, [email]);

    if (rows.length === 0) {
      const error = new ApiError(404, "User not found");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const user = rows[0];

    if (user.password !== password) {
      const error = new ApiError(400, "Wrong password!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    if (user.status !== "Active") {
      const error = new ApiError(400, "Inactive account, please contact Admin!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
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

    const response = new ApiResponse(200, userObj, "Login successful");

    return res
    .status(200)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json({ success: true, data: userObj, accessToken, refreshToken });

  } catch (error) {
    console.error("Login Error:", error);
    const err = new ApiError(500, "Something went wrong!", error);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }
};


//-------------> LOGGED OUT CONTROLLER


const loggedOut = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      const error = new ApiError(400, "User not authenticated");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
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

    const response = new ApiResponse(200, null, "Logged out successfully");

    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Logout error:", error);
    const err = new ApiError(500, "An error occurred during logout", error);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }
};


// -------------> REFRESH TOKEN CONTROLLER
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      const error = new ApiError(401, "Unauthorized access or refresh token missing!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    try {
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);

      const [userRows] = await promisePool.query("SELECT * FROM employees WHERE user_id = ?", [decodedToken.userId]);

      if (userRows.length === 0) {
        const error = new ApiError(400, "Invalid refresh token!");
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errors: error.errors,
          data: error.data,
        });
      }

      const user = userRows[0];

      if (incomingRefreshToken !== user.refreshToken) {
        const error = new ApiError(404, "Refresh token expired or already used!");
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errors: error.errors,
          data: error.data,
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user);

      const options = {
        httpOnly: true,
        secure: true,
      };

      const userObj = {
        email: user.email,
        status: user.status,
        role: user.role,
      };

      const response = new ApiResponse(
        200,
        {
          ...userObj,
          accessToken,
          refreshToken: newRefreshToken,
        },
        "New refresh token generated successfully!"
      );

      return res
        .status(response.statusCode)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({
          success: response.success,
          message: response.message,
          data: response.data,
        });

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const err = new ApiError(401, "Refresh token has expired. Please log in again.");
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          errors: err.errors,
          data: err.data,
        });
      }

      const err = new ApiError(500, "Error verifying token", error);
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors,
        data: err.data,
      });
    }

  } catch (error) {
    console.error("Refresh Token error:", error);
    const err = new ApiError(500, "An error occurred during token refresh.", error);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }
};




module.exports = { userRegister, loginApi, loggedOut,refreshAccessToken };
