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

    // Parse input dates and current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize to midnight

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (start <= today || end <= today) {
      return res.status(400).json({
        success: false,
        message: "Leave can only be applied for future dates!",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date!",
      });
    }

    // Check if employee exists
    const isUserCheckQuery = "SELECT * FROM employees WHERE employee_id=?";
    const [isExistUser] = await promisePool.query(isUserCheckQuery, [employee_id]);

    if (isExistUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }

    // Check if overlapping leave request already exists
    const isLeaveRequestAlreadyQuery = `
      SELECT * FROM employee_leaves 
      WHERE employee_id = ? 
        AND (
          (start_date BETWEEN ? AND ?) 
          OR (end_date BETWEEN ? AND ?)
          OR (? BETWEEN start_date AND end_date)
          OR (? BETWEEN start_date AND end_date)
        )`;

    const leaveRequestDate = [
      employee_id,
      start_date,
      end_date,
      start_date,
      end_date,
      start_date,
      end_date,
    ];
    const [isleaveRequestAlready] = await promisePool.query(
      isLeaveRequestAlreadyQuery,
      leaveRequestDate
    );

    if (isleaveRequestAlready.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A leave request already exists for the specified dates!",
        data: isleaveRequestAlready,
      });
    }

    // Insert leave request
    const leaveInsertQuery = `
      INSERT INTO employee_leaves (employee_id, leave_type, start_date, end_date, reason) 
      VALUES (?, ?, ?, ?, ?)`;

    const leaveInputData = [employee_id, leave_type, start_date, end_date, reason];

    const [applyForLeaveQuery] = await promisePool.query(
      leaveInsertQuery,
      leaveInputData
    );

    res.status(200).json({
      success: true,
      message: "Leave request applied successfully",
      data: applyForLeaveQuery,
    });
  } catch (error) {
    console.error("Error in LEAVE_REQUEST API:", error);
    res.status(500).json({
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

  if (!['Approved', 'Rejected'].includes(action)) {
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

    // Update the leave request status
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




module.exports = {applyforLeave,approveLeaveRequest}

