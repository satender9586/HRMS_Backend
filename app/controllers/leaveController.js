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

    const start = new Date(start_date);
    const end = new Date(end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const startDateStr = start.toISOString().split('T')[0]; 

 
    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be earlier than start date!",
      });
    }


    if (start.getTime() === today.getTime()) {
      const isAlreadyPunchedQuery = `
        SELECT * FROM attendence 
        WHERE employee_id = ? AND DATE(punch_date) = ?`;
      const [alreadyPunched] = await promisePool.query(isAlreadyPunchedQuery, [
        employee_id,
        startDateStr,
      ]);

      if (alreadyPunched.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already punched in today. Leave cannot be applied.",
        });
      }
    }

  
    if (start < today) {
      return res.status(400).json({
        success: false,
        message: "Leave can only be applied for today or future dates!",
      });
    }


    const isUserCheckQuery = "SELECT * FROM employees WHERE employee_id = ?";
    const [isExistUser] = await promisePool.query(isUserCheckQuery, [employee_id]);

    if (isExistUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }


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

    const [isLeaveRequestAlready] = await promisePool.query(
      isLeaveRequestAlreadyQuery,
      leaveRequestDate
    );

    if (isLeaveRequestAlready.length > 0) {
      return res.status(400).json({
        success: false,
        message: "A leave request already exists for the selected dates.",
        data: isLeaveRequestAlready,
      });
    }


    const leaveInsertQuery = `
      INSERT INTO employee_leaves 
        (employee_id, leave_type, start_date, end_date, reason) 
      VALUES (?, ?, ?, ?, ?)`;

    const leaveInputData = [employee_id, leave_type, start_date, end_date, reason];

    const [applyForLeaveQuery] = await promisePool.query(
      leaveInsertQuery,
      leaveInputData
    );

    res.status(200).json({
      success: true,
      message: "Leave request submitted successfully.",
      data: applyForLeaveQuery.affectedRows,
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

const retriveMyAllLeaves = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id;

  try {
    
    if (!user || !userId || !employee_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user data: user, userId or employee_id."
      });
    }

    const [getAllLeave] = await promisePool.query('SELECT * FROM employee_leaves WHERE employee_id = ?', [employee_id]);

 
    if (getAllLeave.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leaves found for this employee."
      });
    }


    return res.status(200).json({
      success: true,
      message: "Leaves fetched successfully.",
      data: getAllLeave
    });

  } catch (error) {
    console.error("Error in retriveMyAllLeaves API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later."
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const retriveAllLeaves = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;
  const employee_id = req.user?.employee_id;
  const role = req.user.role; 

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
        message: "you are not admin or super admin!.."
      });
    }

    const [getAllLeaves] = await promisePool.query('SELECT * FROM employee_leaves');

    if (getAllLeaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leave records found!"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leaves fetched successfully!",
      data: getAllLeaves
    });

  } catch (error) {
    console.error("Error in retrieveAllLeaves API:", error);
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



module.exports = {applyforLeave,approveLeaveRequest,retriveMyAllLeaves,retriveAllLeaves}

