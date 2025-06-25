const { promisePool } = require("../config/dbConnected");
const { ApiError } = require("../lib/apiError");
const { ApiResponse } = require("../lib/apiResponse");
const { getCurrentDate, shortDates } = require("../lib/Methods.js");

const makeEmployeeActiveDeactive = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const role = req.user.role;
  const incommingEmployeeId = req.body.employeeId;

  try {
    if (!user || !userId) {
      const error = new ApiError(400, "userId and token missing!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    if (!incommingEmployeeId) {
      const error = new ApiError(400, "Employee ID is required!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [employee] = await promisePool.query(
      "SELECT status FROM employees WHERE employee_id = ?",
      [incommingEmployeeId]
    );

    if (employee.length === 0) {
      const error = new ApiError(404, "Employee not found!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const currentStatus = employee[0].status;
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    const [updateResult] = await promisePool.query(
      "UPDATE employees SET status = ? WHERE employee_id = ?",
      [newStatus, incommingEmployeeId]
    );

    if (updateResult.affectedRows === 0) {
      const error = new ApiError(400, "Failed to update employee status!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const response = new ApiResponse(
      200,
      { status: newStatus },
      `Employee status toggled to ${newStatus}`
    );
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    console.log("Something went wrong:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};
const retriveAllEmployeeList = async (req, res) => {
  const { user_id: userId, role } = req.user || {};

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID and token missing.",
    });
  }

  try {
    const [employees] = await promisePool.query(`
      SELECT 
        e.employee_id, e.role, e.email, e.status, e.department,
        pd.first_name, pd.last_name, pd.date_of_birth, pd.gender, pd.marital_status, pd.blood_group,
        bd.bank_name, bd.bank_number, bd.ifsc_number, bd.pan_number, bd.pf_number,
        cd.phone_number, cd.alternative_email, cd.address, cd.emergency_number
      FROM employees e
      LEFT JOIN personal_details pd ON e.employee_id = pd.employee_id
      LEFT JOIN bank_details bd ON e.employee_id = bd.employee_id
      LEFT JOIN contact_details cd ON e.employee_id = cd.employee_id
    `);

    // Format the data into structured objects
    const formattedEmployees = employees.map((emp) => ({
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
    }));

    // Send a success response
    return res.status(200).json({
      success: true,
      message: "Employee list retrieved successfully.",
      data: formattedEmployees,
    });
  } catch (error) {
    // Handle errors
    console.error("Error retrieving employee list:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while retrieving employee data.",
      error: error.message,
    });
  }
};
const retriveEmployeeProfiles = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const role = user?.role;
  const employeeId = req.params.empId?.trim();

  try {
    // Validate user presence
    if (!user || !userId) {
      return res.status(400).json({
        success: false,
        message: "User ID and token missing!",
        data: null,
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required.",
        data: null,
      });
    }

    // Query for employee data
    const [rows] = await promisePool.query(
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
      [employeeId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
        data: null,
      });
    }

    const emp = rows[0];
    const data = {
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

    return res.status(200).json({
      success: true,
      message: "Employee profile retrieved successfully.",
      data: data,
    });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      data: null,
    });
  }
};
const makeAnnoucement = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const { message } = req.body;

  try {
    // Validate token
    if (!user || !userId) {
      const error = new ApiError(400, "userId and token missing!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    // Validate input
    if (!message) {
      const error = new ApiError(400, "Message field is missing.");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    // Add announcement
    const currDate = getCurrentDate();
    const [result] = await promisePool.query(
      `INSERT INTO announcement (message, date, create_by) VALUES (?, ?, ?)`,
      [message, currDate, userId]
    );

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      data: {
        announcement_id: result.insertId,
        message,
        date: currDate,
        create_by: userId,
      },
    });
  } catch (error) {
    console.log("Something went wrong:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};
const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements] = await promisePool.query(
      `SELECT * FROM announcement`
    );

    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully.",
      data: announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching announcements.",
      data: null,
    });
  }
};
const updateAnnouncement = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const { id } = req.params;
  const { message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message field is required.",
      });
    }

    const [result] = await promisePool.query(
      `UPDATE announcement SET message = ? WHERE announcement_id = ? AND create_by = ?`,
      [message, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully.",
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating.",
    });
  }
};
const deleteAnnouncement = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const { id } = req.params;

  try {
    const [result] = await promisePool.query(
      `DELETE FROM announcement WHERE announcement_id = ? AND create_by = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found or unauthorized.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting.",
    });
  }
};
const retiveCelebration = async (req, res) => {
  try {
    const [birthdays] = await promisePool.query(`
      SELECT 
        CONCAT(first_name, ' ', last_name) AS name,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS celebration_date,
        'Birthday' AS type
      FROM personal_details
    `);

    const dataAfterSort = shortDates(birthdays)
    return res.status(200).json({
      success: true,
      message: "Birthdays sorted by month and day",
      data: dataAfterSort,
    });

  } catch (error) {
    console.error("Error fetching birthdays:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching birthdays.",
      error: error.message,
      data: null,
    });
  }
};
const generateBasicSummary = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;

  if (!user || !userId) {
    const error = new ApiError(400, "userId and token missing!");
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
      data: error.data,
    });
  }

  try {
    const today = getCurrentDate(); 

    const isWeekend = [0, 6].includes(new Date(today).getDay()); 
    const [[{ isHoliday }]] = await promisePool.query(`
      SELECT COUNT(*) AS isHoliday FROM official_holidays WHERE start_date <= ? AND end_date >= ?
    `, [today, today]);

    if (isWeekend || isHoliday > 0) {
      return res.status(200).json({
        success: true,
        message: "Today is a weekend or holiday. No summary applicable.",
        data: {
          totalEmployees: 0,
          totalPresent: 0,
          totalLeave: 0,
          totalLeaveRequest: 0,
          totalAbsent: 0,
        },
      });
    }

     const [[{ totalEmployees }]] = await promisePool.query(`
      SELECT COUNT(*) AS totalEmployees FROM employees
    `);

    // Total Present Today
    const [[{ totalPresent }]] = await promisePool.query(`
      SELECT COUNT(DISTINCT employee_id) AS totalPresent
      FROM attendence 
      WHERE status = 'Present' AND DATE(punch_date) = ?
    `, [today]);

    // Total Approved Leaves Today
    const [[{ totalLeave }]] = await promisePool.query(`
      SELECT COUNT(DISTINCT employee_id) AS totalLeave
      FROM employee_leaves
      WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    `, [today]);

  
    const [[{ totalLeaveRequest }]] = await promisePool.query(`
      SELECT COUNT(*) AS totalLeaveRequest
      FROM employee_leaves
      WHERE status = 'pending'
    `);

    const totalAbsent = totalEmployees - (totalPresent + totalLeave);
    return res.status(200).json({
      success: true,
      message: "Summary generated successfully",
      data: {
        totalEmployees,
        totalPresent,
        totalLeave,
        totalLeaveRequest,
        totalAbsent,
      },
    });

  } catch (error) {
    console.error("Error generating summary:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating summary.",
      error: error.message,
    });
  }
};



module.exports = {
  makeEmployeeActiveDeactive,
  retriveAllEmployeeList,
  retriveEmployeeProfiles,
  makeAnnoucement,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  retiveCelebration,
  generateBasicSummary
};
