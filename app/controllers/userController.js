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
          const validRoles = ['Super_Admin', 'Admin', 'Employee'];
          const validDepartments = ['Super_Admin', 'Admin', 'HR', 'IT', 'Sales', 'Digital_Marketing', 'Finance'];

        if (typeof role !== 'string' || !role.trim() || !validRoles.includes(role) ||
            typeof department !== 'string' || !department.trim() || !validDepartments.includes(department

          )
        ) {
          const error = new ApiError(400, "Invalid 'role' or 'department'. Must be one of the allowed values.");
          return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            errors: error.errors,
            data: error.data,
          });
        }



   
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
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};


//-------------> COMPLETE FULL INFOMATION OF EMPLOYEE

const addOrUpdateEmployeeFullDetails = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;

  const {
    employee_id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    marital_status,
    blood_group,
    phone_number,
    alternative_email,
    address,
    emergency_number,
    bank_name,
    bank_number,
    ifsc_number,
    pan_number,
    pf_number,
  } = req.body;

  try {

    if (
      !employee_id || !user || !userId ||
      !first_name || !last_name || !date_of_birth || !gender ||
      !marital_status || !blood_group ||
      !phone_number || !alternative_email || !address || !emergency_number ||
      !bank_name || !bank_number || !ifsc_number || !pan_number || !pf_number
    ) {
      const error = new ApiError(400, "All fields are required!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    if (isNaN(Date.parse(date_of_birth))) {
      const error = new ApiError(400, "Invalid date format for date_of_birth!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    // Personal Details
    const [existingPersonal] = await promisePool.query(
      "SELECT * FROM personal_details WHERE employee_id = ?", [employee_id]
    );

    if (existingPersonal.length > 0) {
      await promisePool.query(
        `UPDATE personal_details SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ?, marital_status = ?, blood_group = ? WHERE employee_id = ?`,
        [first_name, last_name, date_of_birth, gender, marital_status, blood_group, employee_id]
      );
    } else {
      await promisePool.query(
        `INSERT INTO personal_details (employee_id, first_name, last_name, date_of_birth, gender, marital_status, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employee_id, first_name, last_name, date_of_birth, gender, marital_status, blood_group]
      );
    }

    // Contact Details
    const [existingContact] = await promisePool.query(
      "SELECT * FROM contact_details WHERE employee_id = ?", [employee_id]
    );

    if (existingContact.length > 0) {
      await promisePool.query(
        `UPDATE contact_details SET phone_number = ?, alternative_email = ?, address = ?, emergency_number = ? WHERE employee_id = ?`,
        [phone_number, alternative_email, address, emergency_number, employee_id]
      );
    } else {
      await promisePool.query(
        `INSERT INTO contact_details (employee_id, phone_number, alternative_email, address, emergency_number) VALUES (?, ?, ?, ?, ?)`,
        [employee_id, phone_number, alternative_email, address, emergency_number]
      );
    }

    // Bank Details
    const [existingBank] = await promisePool.query(
      "SELECT * FROM bank_details WHERE employee_id = ?", [employee_id]
    );

    if (existingBank.length > 0) {
      await promisePool.query(
        `UPDATE bank_details SET bank_name = ?, bank_number = ?, ifsc_number = ?, pan_number = ?, pf_number = ? WHERE employee_id = ?`,
        [bank_name, bank_number, ifsc_number, pan_number, pf_number, employee_id]
      );
    } else {
      await promisePool.query(
        `INSERT INTO bank_details (employee_id, bank_name, bank_number, ifsc_number, pan_number, pf_number) VALUES (?, ?, ?, ?, ?, ?)`,
        [employee_id, bank_name, bank_number, ifsc_number, pan_number, pf_number]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Employee details added/updated successfully",
    });
  } catch (err) {
    console.error("Database error:", err);
    const error = new ApiError(500, "Internal server error!");
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
};


//-------------> LOGGED USER CONTROLLER

const login = async (req, res) => {
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
        pd.first_name, pd.last_name, pd.date_of_birth, pd.gender, pd.marital_status, pd.blood_group,
        bd.bank_name, bd.bank_number, bd.ifsc_number, bd.pan_number, bd.pf_number,
        cd.phone_number, cd.alternative_email, cd.address, cd.emergency_number
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

    const emp = retrieveEmployee[0];

    const structuredEmployee = {
      user_info: {
        employee_id: emp.employee_id,
        role: emp.role,
        email: emp.email,
        status: emp.status,
        department: emp.department,
      },
      personal_info: {
        first_name: emp.first_name,
        last_name: emp.last_name,
        date_of_birth: emp.date_of_birth,
        gender: emp.gender,
        marital_status: emp.marital_status,
        blood_group: emp.blood_group,
      },
      bank_info: {
        bank_name: emp.bank_name,
        bank_number: emp.bank_number,
        ifsc_number: emp.ifsc_number,
        pan_number: emp.pan_number,
        pf_number: emp.pf_number,
      },
      contact_info: {
        phone_number: emp.phone_number,
        alternate_email: emp.alternative_email,
        address: emp.address,
        emergency_number: emp.emergency_number,
      },
    };

    const response = new ApiResponse(
      200,
      structuredEmployee,
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
  addOrUpdateEmployeeFullDetails,
  login,
  loggedOut,
  refreshAccessToken,
  authInfoRetrive,
};
