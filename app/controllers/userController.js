const { promisePool } = require("../config/dbConnected.js");
const { generateAccessAndRefreshToken } = require("../lib/function.js");
const { generateEmployeeId } = require("../lib/asynHandler.js");
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

    const generateId = await generateEmployeeId();

    const [existingId] = await promisePool.query("SELECT * FROM employees WHERE employee_id = ?",[generateId]);

    if (existingId.length > 0) {
      const error = new ApiError(400,"Generated Employee ID already exists. Please try again.");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [result] = await promisePool.query(
      "INSERT INTO employees (email, password, role, department, employee_id) VALUES (?, ?, ?, ?, ?)",
      [email, password, role, department, generateId]
    );

    if (result.affectedRows === 1) {
      const data = {id: result.insertId, email, role,  department,  employeeId: generateId, };
      const response = new ApiResponse(
        201,
        data,
        "User registered successfully!"
      );
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
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};

//-------------> EMPLOYEE PERSONAL DETAILS CONTROLLER

const addEmployeeBasicPersonalDetails = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;

  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    marital_status,
    blood_group,
    employee_id,
  } = req.body;

  try {
    if (
      !employee_id ||
      !user ||
      !userId ||
      !first_name ||
      !last_name ||
      !date_of_birth ||
      !gender ||
      !marital_status ||
      !blood_group
    ) {
      const errors = new ApiError(500, "All fields are required!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    if (isNaN(Date.parse(date_of_birth))) {
      const errors = new ApiError(
        400,
        "Invalid date format for date_of_birth!"
      );
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    const [existingDetails] = await promisePool.query(
      "SELECT * FROM personal_details WHERE employee_id = ?",
      [employee_id]
    );

    if (existingDetails.length > 0) {
      const errors = new ApiError(400, "Personal details already exist!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO personal_details 
        (employee_id, first_name, last_name, date_of_birth, gender, marital_status, blood_group)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        marital_status,
        blood_group,
      ]
    );

    const response = new ApiResponse(
      201,
      result.insertId,
      "Personal details added successfully"
    );
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (err) {
    console.error("Database error:", err);
    const errors = new ApiError(500, "Internal server error!");
    return res.status(errors.statusCode).json({
      success: false,
      message: errors.message,
      errors: errors.errors,
      data: errors.data,
    });
  }
};

//-------------> EMPLOYEE CONTACT DETAILS CONTROLLER
const addEmployeeContactDetails = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;

  const { phoneNumber, alterEmail, address, emergencyNumber, employee_id } =
    req.body;

  try {
    if (
      !employee_id ||
      !user ||
      !userId ||
      !phoneNumber ||
      !alterEmail ||
      !address ||
      !emergencyNumber
    ) {
      const error = new ApiError(400, "All fields are required!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [existingContact] = await promisePool.query(
      "SELECT * FROM contact_details WHERE phoneNumber = ? OR alterEmail = ?",
      [phoneNumber, alterEmail]
    );

    if (existingContact.length > 0) {
      const error = new ApiError(409, "Phone number or email already exists!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [userContact] = await promisePool.query(
      "SELECT * FROM contact_details WHERE employee_id = ?",
      [employee_id]
    );

    if (userContact.length > 0) {
      const error = new ApiError(
        400,
        "Contact details already exist for this user!"
      );
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO contact_details 
        (employee_id, phoneNumber, alterEmail, address, emergencyNumber)
       VALUES (?, ?, ?, ?, ?)`,
      [employee_id, phoneNumber, alterEmail, address, emergencyNumber]
    );
    const response = new ApiResponse(
      201,
      result.insertId,
      "Contact details added successfully"
    );
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (err) {
    console.error("Database error:", err);
    const error = new ApiError(500, "Internal server error");
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      data: error.data,
    });
  }
};

//-------------> BANK DETAILS CONTROLLER

const addEmployeeBankDetails = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;

  const {
    employee_id,
    bank_name,
    bank_number,
    ifsc_number,
    pan_number,
    pf_number,
  } = req.body;

  try {
    if (
      !employee_id ||
      !user ||
      !userId ||
      !bank_name ||
      !bank_number ||
      !ifsc_number ||
      !pan_number ||
      !pf_number
    ) {
      const error = new ApiError(400, "All fields are required!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [existingBank] = await promisePool.query(
      "SELECT * FROM bank_details WHERE employee_id = ?",
      [employee_id]
    );

    if (existingBank.length > 0) {
      const error = new ApiError(
        400,
        "Bank details already exist for this user!"
      );
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO bank_details 
        (employee_id, bank_name, bank_number, ifsc_number, pan_number, pf_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, bank_name, bank_number, ifsc_number, pan_number, pf_number]
    );

    return res.status(201).json({
      success: true,
      message: "Bank details added successfully",
      bank_id: result.insertId,
    });
  } catch (err) {
    console.error("Database error:", err);
    const error = new ApiError(500, "Internal server error!");
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      data: error.data,
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
        .json({ success: false, message: "Email is missing!" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is missing!" });
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
    if (user.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Inactive account, please contact Admin!",
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    const userObj = {
      email: user.email,
      status: user.status,
      role: user.role,
      employee_id: user.employee_id,
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
    if (!req.user || !req.user.employee_id) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const { user_id, employee_id } = req.user;

    const options = {
      httpOnly: true,
      secure: true,
    };

    res.clearCookie("refreshToken", options);
    res.clearCookie("accessToken", options);

    await promisePool.query(
      "UPDATE employees SET refreshToken = NULL WHERE employee_id = ?",
      [employee_id]
    );

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      message: "An error occurred during logout",
      error: error.message,
    });
  }
};

// -------------> REFRESH TOKEN CONTROLLER
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Unauthorized access or refresh token missing!",
        });
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
      );

      const [userRows] = await promisePool.query(
        "SELECT * FROM employees WHERE employee_id = ?",
        [decodedToken.employee_id]
      );

      if (userRows.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid refresh token!" });
      }

      const user = userRows[0];

      if (incomingRefreshToken !== user.refreshToken) {
        return res
          .status(404)
          .json({ success: false, message: "Refresh token expired or used!" });
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await generateAccessAndRefreshToken(user);

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
        .cookie("refreshToken", newRefreshToken, options)
        .json({
          success: true,
          message: "New refresh token generated successfully!",
          data: userObj,
          accessToken,
          newRefreshToken,
        });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
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

// -------------> AUTH INFO RETRIVE

const authInfoRetrive = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const role = req.user.role;
  const incommingEmployeeId = req.user.employee_id; 

  try {
    if (!user || !userId) {
      const error = new ApiError(400, "User ID and token are missing!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [retrieveEmployee] = await promisePool.query(
      `
      SELECT 
        e.employee_id, e.role, e.email, e.status, e.department,
        pd.*, 
        bd.*, 
        cd.*
      FROM employees e
      LEFT JOIN personal_details pd ON e.employee_id = pd.employee_id
      LEFT JOIN bank_details bd ON e.employee_id = bd.employee_id
      LEFT JOIN contact_details cd ON e.employee_id = cd.employee_id
      WHERE e.employee_id = ?
    `,
      [incommingEmployeeId]
    );

    if (!retrieveEmployee || retrieveEmployee.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
        data: null,
      });
    }


    const employeeData = { ...retrieveEmployee[0] };
    delete employeeData.password;
    delete employeeData.refreshToken;

    const response = new ApiResponse(
      200,
      employeeData,
      "Employee profile retrieved successfully"
    );

    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Error retrieving employee:", error);
    const errors = new ApiError(
      500,
      "An error occurred while retrieving employee data.",
      error.message
    );
    return res.status(errors.statusCode).json({
      success: false,
      message: errors.message,
      errors: errors.errors,
      data: errors.data,
    });
  }
};

module.exports = {
  userRegister,
  addEmployeeBasicPersonalDetails,
  addEmployeeContactDetails,
  addEmployeeBankDetails,
  loginApi,
  loggedOut,
  refreshAccessToken,
  authInfoRetrive,
};
