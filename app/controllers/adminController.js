const { promisePool } = require("../config/dbConnected");
const { ApiError } = require("../lib/apiError");
const { ApiResponse } = require("../lib/apiResponse");

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

    if (role !== 2 && role !== 3) {
      const error = new ApiError(400, "You are not an admin or super admin!");
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
  const user = req.user;
  const userId = req.user.user_id;
  const role = req.user.role;

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

    if (role !== 2 && role !== 3) {
      const error = new ApiError(400, "You are not admin or super admin!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    const [retrieveEmployee] = await promisePool.query(`
          SELECT 
            e.employee_id, e.role, e.email, e.password, e.status, e.department,
            pd.*, 
            bd.*, 
            cd.*
          FROM employees e
          LEFT JOIN personal_details pd ON e.employee_id = pd.employee_id
          LEFT JOIN bank_details bd ON e.employee_id = bd.employee_id
          LEFT JOIN contact_details cd ON e.employee_id = cd.employee_id
          `);

    const response = new ApiResponse(200, { status: retrieveEmployee }, `Employee list retrieved successfully`);
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data.status,
    });

  } catch (error) {
    console.error(error);
    const errors = new ApiError(500,"An error occurred while retrieving employee data.",error.message);
    return res.status(errors.statusCode).json({
      success: false,
      message: errors.message,
      errors: errors.errors,
      data: errors.data,
    });
  }
};

module.exports = { makeEmployeeActiveDeactive, retriveAllEmployeeList };
