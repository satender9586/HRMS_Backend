const { promisePool } = require("../config/dbConnected.js");
const { ApiError } = require("../lib/apiError.js")
const { ApiResponse } = require("../lib/apiResponse.js")
const { isLeaveExistsQuery, updateExistsLeaveQuery, insertAllotedLeaveQuery, isPunchInExistsQuery, } = require("../lib/apiQuery.js")
const { checkUserExistsQuery, leaveOverlapQuery, pendingLeaveQuery, insertLeaveQuery } = require("../lib/apiQuery.js")
const { getDiffInTwoDates } = require("../lib/function.js");



// allocate leaves to employees 
const allocateLeaves = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const { employee_id, leave_name, total } = req.body;
  try {

    // validate authentication
    if (!user || !userId) {
      const errors = new ApiError(400, "Missing user data: user, userId anauthorised!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    // validate incomming body fields
    const isMatchedLeaveIncommingName = ['sick']
    if (!employee_id || !total || !isMatchedLeaveIncommingName.includes(leave_name)) {
      const errors = new ApiError(400, " Missing or invalid fields : employee_id, total leaves, leavenames ");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    // cheked is leave already exists or not
    const [isLeaveExists] = await promisePool.query(isLeaveExistsQuery, [employee_id, leave_name])

    if (isLeaveExists.length > 0) {
      const [updateLeave] = await promisePool.query(updateExistsLeaveQuery, [total, employee_id, leave_name])
      const response = new ApiResponse(200, updateLeave.affectedRows, "Leave Balance Update Successfully!");
      return res.status(response.statusCode).json({
        success: response.success,
        message: response.message,
        data: response.data,
      });
    }

    // insert new entry
    const inserQuery = insertAllotedLeaveQuery
    const [inserdata] = await promisePool.query(inserQuery, [employee_id, leave_name, total])

    const response = new ApiResponse(200, inserdata.insertId, "Leave allocated succesfully");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Error in leave allocated API:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });

  }
};

// allocate leaves balance 
const allocatedLeaveSummary = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id
  const { leave_name } = req.query;
  try {

    // validate authentication
    if (!user || !userId) {
      const errors = new ApiError(400, "Missing user data: user, userId anauthorised!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    // allotocated leave or remaining summary


    const remainingLeaveStatusQuery = `
      SELECT * FROM leave_balance 
      WHERE employee_id = ? AND leave_name = ?
    `;

    const [remainingLeaveStatus] = await promisePool.query(
      remainingLeaveStatusQuery,
      [employee_id, leave_name]
    );
    const response = new ApiResponse(200, remainingLeaveStatus[0], "Retrive Leave Allocated Summary");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });


  } catch (error) {
    console.error("Error in leave remaining status API:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const leaveRequest = async (req, res) => {
  const user = req.user;
  const employee_id = req.user?.employee_id;
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
 
    if (!user || !leave_type || !start_date || !end_date || !reason) {
      const error = new ApiError(400, "Missing required fields: leave_type, start_date, end_date, reason.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const start = new Date(start_date);
    const end = new Date(end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

   
    if (end < start) {
      const error = new ApiError(400, "End date cannot be earlier than start date.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }


    if (start < today) {
      const error = new ApiError(400, "Leave can only be applied for today or future dates.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

  
    if (start <= today && end >= today) {
      const [alreadyPunchedToday] = await promisePool.query(isPunchInExistsQuery, [employee_id, todayStr]);
      if (alreadyPunchedToday.length > 0) {
        const error = new ApiError(400, "You have already punched in today. Leave cannot include today.");
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
    }

   
    const [userExists] = await promisePool.query(checkUserExistsQuery, [employee_id]);
    if (userExists.length === 0) {
      const error = new ApiError(404, "User does not exist.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    const leaveOverlapParams = [
      employee_id, start_date, end_date,
      start_date, end_date, start_date, end_date,
    ];
    const [overlappingLeaves] = await promisePool.query(leaveOverlapQuery, leaveOverlapParams);

    if (overlappingLeaves.length > 0) {
      const overlap = overlappingLeaves[0];
      if (overlap.status === "cancelled") {
        const cancelledLeaveId = overlap.leave_request_id;
        await promisePool.query('DELETE FROM employee_leaves WHERE leave_request_id = ?', [cancelledLeaveId]);
      } else {
        const error = new ApiError(409, "A leave request already exists for the selected dates.");
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
    }


    const [pendingLeaves] = await promisePool.query(pendingLeaveQuery, [employee_id]);
    if (pendingLeaves.length > 0) {
      const error = new ApiError(409, "You already have a pending leave request. Please wait for it to be approved or rejected.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

   
    const [leaveBalanceCheck] = await promisePool.query('SELECT * FROM leave_balance WHERE employee_id = ? AND leave_name = ?',
      [employee_id, leave_type]
    );
    if (leaveBalanceCheck.length === 0) {
      const error = new ApiError(404, "You have not been allocated this type of leave.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    const dateDiff = getDiffInTwoDates(start_date, end_date);
    const remainingLeaves = leaveBalanceCheck[0].remaining;

    if (remainingLeaves < dateDiff) {
      const error = new ApiError(400, "Insufficient leave balance.");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

 
    await promisePool.query(
      'UPDATE leave_balance SET used = used + ? WHERE employee_id = ? AND leave_name = ?',
      [dateDiff, employee_id, leave_type]
    );

  
    const [result] = await promisePool.query(insertLeaveQuery, [
      employee_id, leave_type, start_date, end_date, reason
    ]);

    const response = new ApiResponse(200, result.insertId, "Leave request submitted successfully.");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Error in leaveRequest API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const retriveMyAllLeaves = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;
  const employee_id = req.user?.employee_id;

  try {
    // validate authentication
    if (!user || !userId) {
      const errors = new ApiError(400, "Missing user data: user, userId anauthorised!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }


    const query = `
      SELECT 
        leave_request_id,
        employee_id,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        status,
        DATE_FORMAT(request_date, '%Y-%m-%d %H:%i:%s') AS request_date,
        DATE_FORMAT(action_date, '%Y-%m-%d %H:%i:%s') AS action_date,
        action_by,
        leave_type,
        reason,
        remark,
        DATEDIFF(end_date, start_date) + 1 AS total_days
      FROM employee_leaves
      WHERE employee_id = ?
      ORDER BY start_date DESC
    `;

    const [getAllLeave] = await promisePool.query(query, [employee_id]);

    if (getAllLeave.length === 0) {
      const errors = new ApiError(404, "No leaves found for this employee");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    const enrichedLeaves = getAllLeave.map((leave) => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);

      const leave_dates = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        leave_dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }

      const start_day = startDate.toLocaleDateString("en-US", { weekday: "long", });
      const end_day = endDate.toLocaleDateString("en-US", { weekday: "long" });

      return {
        ...leave,
        start_day,
        end_day,
        leave_dates,
      };
    });

    const response = new ApiResponse(200, enrichedLeaves, "Leaves fetched successfully.");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });
  } catch (error) {
    console.error("Error in retrive all leaves API:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const listAllLeaveApplications = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;
  const employee_id = req.user?.employee_id;
  const role = req.user?.role;

  try {
    if (!user || !userId || !employee_id) {
      const errors = new ApiError(404, "UserId and token are missing!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    if (role !== "Super_Admin" && role !== "Admin") {
      const errors = new ApiError(404, "You are not admin or super admin!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    const query = `
      SELECT 
        leave_request_id,
        employee_id,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        status,
        DATE_FORMAT(request_date, '%Y-%m-%d %H:%i:%s') AS request_date,
        DATE_FORMAT(action_date, '%Y-%m-%d %H:%i:%s') AS action_date,
        action_by,
        leave_type,
        reason,
        remark
      FROM employee_leaves
      ORDER BY start_date DESC
    `;

    const [getAllLeaves] = await promisePool.query(query);

    if (getAllLeaves.length === 0) {
      const errors = new ApiError(404, "No leave records found!");
      return res.status(errors.statusCode).json({
        success: false,
        message: errors.message,
        errors: errors.errors,
        data: errors.data,
      });
    }

    const enrichedLeaves = getAllLeaves.map((leave) => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);

      const timeDiff = endDate.getTime() - startDate.getTime();
      const total_days = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;

      const leave_dates = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        leave_dates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }

      const start_day = startDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const end_day = endDate.toLocaleDateString("en-US", { weekday: "long" });
      return {...leave,total_days,leave_dates,start_day,end_day,};
    });


    const response = new ApiResponse(200, enrichedLeaves, "Leaves fetched successfully!");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Error in retriveAllLeaves API:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: error.errors,
      data: error.data,
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const LeaveAction = async (req, res) => {
  const userId = req.user.user_id;
  const { leave_request_id } = req.params;
  const { action } = req.body;

  const validActions = ["approved", "rejected", "cancelled"];
  const actionLower = action?.toLowerCase();

  if (!validActions.includes(actionLower)) {
    const error = new ApiError(400, "Invalid action!");
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }

  try {
    const [[leave]] = await promisePool.query("SELECT * FROM employee_leaves WHERE leave_request_id = ?",[leave_request_id]);

    if (!leave) {
      const error = new ApiError(404, "Leave request not found!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    const currentStatus = leave.status.toLowerCase();

 
    if (currentStatus === actionLower) {
      const error = new ApiError(400, `Leave already ${actionLower}`);
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }


    if (actionLower === "approved" && currentStatus === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot approve a cancelled leave." });
    }

    if (actionLower === "rejected" && currentStatus === "approved") {
      return res.status(400).json({ success: false, message: "Cannot reject an already approved leave." });
    }

     if (actionLower === "cancelled" && currentStatus === "approved") {
      const employeeId = leave.employee_id;
      const leaveType = leave.leave_type;
      const dateDiff = getDiffInTwoDates(leave.start_date, leave.end_date);
      await promisePool.query(`UPDATE leave_balance SET used = used - ? WHERE employee_id = ? AND leave_name = ?`,
        [dateDiff, employeeId, leaveType]
      );
    }

    await promisePool.query(
      `UPDATE employee_leaves SET status = ?, action_date = NOW(), action_by = ? WHERE leave_request_id = ?`,
      [actionLower, userId, leave_request_id]
    );

    const response = new ApiResponse(200, null, `Leave ${actionLower} and request updated successfully.`);
    return res.status(response.statusCode).json({
      success: true,
      message: response.message,
      data: null,
    });

  } catch (error) {
    console.error("Error updating leave status:", error);
    const apiError = new ApiError(500, "Something went wrong!");
    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      error: error.message,
    });
  }
};


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

module.exports = {
  leaveRequest,
  LeaveAction,
  retriveMyAllLeaves,
  listAllLeaveApplications,
  allocateLeaves,
  allocatedLeaveSummary
};
