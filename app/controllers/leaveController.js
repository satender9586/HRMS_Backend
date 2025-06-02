const { promisePool } = require("../config/dbConnected.js");


//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const applyforLeave = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id;
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    if (!user || !leave_type || !start_date || !end_date || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const start = new Date(start_date);
    const end = new Date(end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date!",
      });
    }

    // Check if applying for any date before today
    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Leave can only be applied for today or future dates!",
      });
    }

    // ⛔ Check if employee has punched in today and trying to apply for leave today
    if (start <= today && end >= today) {
      const punchQuery = `
        SELECT * FROM attendence
        WHERE employee_id = ? AND DATE(punch_date) = ?
      `;
      const [alreadyPunchedToday] = await promisePool.query(punchQuery, [
        employee_id,
        todayStr,
      ]);

      if (alreadyPunchedToday.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already punched in today. Leave cannot include today.",
        });
      }
    }

    // Check if employee exists
    const [userExists] = await promisePool.query(
      "SELECT * FROM employees WHERE employee_id = ?",
      [employee_id]
    );
    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User does not exist!",
      });
    }

    // Check if leave already exists for selected range
    const leaveOverlapQuery = `
      SELECT * FROM employee_leaves
      WHERE employee_id = ?
        AND (
          (start_date BETWEEN ? AND ?)
          OR (end_date BETWEEN ? AND ?)
          OR (? BETWEEN start_date AND end_date)
          OR (? BETWEEN start_date AND end_date)
        )
    `;

    const leaveOverlapParams = [
      employee_id,
      start_date,
      end_date,
      start_date,
      end_date,
      start_date,
      end_date,
    ];

    const [overlappingLeaves] = await promisePool.query(
      leaveOverlapQuery,
      leaveOverlapParams
    );

    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A leave request already exists for the selected dates.",
        data: overlappingLeaves,
      });
    }

    // Insert leave request
    const insertLeaveQuery = `
      INSERT INTO employee_leaves (employee_id, leave_type, start_date, end_date, reason)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await promisePool.query(insertLeaveQuery, [
      employee_id,
      leave_type,
      start_date,
      end_date,
      reason,
    ]);

    return res.status(200).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: result.insertId,
    });
  } catch (error) {
    console.error("Error in LEAVE_REQUEST API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
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
    if (!user || !userId || !employee_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user data: user, userId or employee_id.",
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
      return res.status(404).json({
        success: false,
        message: "No leaves found for this employee.",
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


      const start_day = startDate.toLocaleDateString("en-US", { weekday: "long" });
      const end_day = endDate.toLocaleDateString("en-US", { weekday: "long" });

      return {
        ...leave,
        start_day,
        end_day,
        leave_dates
      };
    });

    return res.status(200).json({
      success: true,
      message: "Leaves fetched successfully.",
      data: enrichedLeaves,
    });

  } catch (error) {
    console.error("Error in retriveMyAllLeaves API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
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
      return res.status(404).json({
        success: false,
        message: "UserId and token are missing!"
      });
    }

    if (role !== "Super_Admin" && role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You are not admin or super admin!"
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
      return res.status(404).json({
        success: false,
        message: "No leave records found!"
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


      const start_day = startDate.toLocaleDateString("en-US", { weekday: "long" });
      const end_day = endDate.toLocaleDateString("en-US", { weekday: "long" });

      return {
        ...leave,
        total_days,
        leave_dates,
        start_day,
        end_day
      };
    });

    return res.status(200).json({
      success: true,
      message: "Leaves fetched successfully!",
      data: enrichedLeaves
    });

  } catch (error) {
    console.error("Error in retriveAllLeaves API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const approveLeaveRequest = async (req, res) => {
  const userId = req.user.user_id;
  const { leave_request_id } = req.params;
  const { action } = req.body;

  if (!['Approved', 'Rejected', 'Cancelled'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid action' });
  }

  try {
    const [[leave]] = await promisePool.query(
      'SELECT * FROM employee_leaves WHERE leave_request_id = ?',
      [leave_request_id]
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status === action) {
      return res.status(400).json({ success: false, message: `Leave already ${action.toLowerCase()}` });
    }

    if (action.toUpperCase() === 'Cancelled' && (leave.status.toUpperCase() === 'Approved' || leave.status === 'Rejected')) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${leave.status.toLowerCase()} leave` });
    }

    await promisePool.query(
      `UPDATE employee_leaves 
       SET status = ?, action_date = NOW(), action_by = ? 
       WHERE leave_request_id = ?`,
      [action, userId, leave_request_id]
    );

    res.status(200).json({
      success: true,
      message: `Leave ${action.toLowerCase()} and leave request updated.`
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



module.exports = {applyforLeave,approveLeaveRequest,retriveMyAllLeaves,listAllLeaveApplications}

