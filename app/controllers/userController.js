const { promisePool } = require("../config/dbConnected.js");
const { generateAccessAndRefreshToken } = require("../lib/function.js");
const { ApiError } = require("../lib/apiError.js");
const { ApiResponse } = require("../lib/apiResponse.js");

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

    const [userExists] = await promisePool.query("SELECT * FROM employees WHERE email = ?",[email]);

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

    const errors = new ApiError(500,"Failed to register user.");
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
      return res
        .status(400)
        .json({
          success: false,
          message: "Inactive account, please contact Admin!",
        });
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user);

  

    return res.status(200).json({ success: true, user, accessToken, refreshToken });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong!", error });
  }
};


module.exports = { userRegister, loginApi };
