const { promisePool } = require("../config/dbConnected.js");
const { getCurrentDate } = require("../lib/function.js");

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> punch in api

const punchIn = async (req, res) => {
  const { users_id } = req.body;

  try {
    if (!users_id) {
      return res
        .status(404)
        .json({ success: false, message: "userId is missing!" });
    }

    const userfindQuery = "SELECT * FROM users WHERE user_id = ?";
    const [userExists] = await promisePool.query(userfindQuery, [users_id]);

    if (userExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist!",
      });
    }

    const currentDate = getCurrentDate();

    const isAlreadyPunchedQuery =
      "SELECT * FROM attendence WHERE users_id = ? AND DATE(punch_date) = ?";
    const [alreadyPunched] = await promisePool.query(isAlreadyPunchedQuery, [
      users_id,
      currentDate,
    ]);

    if (alreadyPunched.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User has already punched in today!",
        alreadyPunched,
        currentDate,
      });
    }

    const punchInQuery =
      "INSERT INTO attendence(users_id, punch_date, punch_in) VALUES(?, ?, CURRENT_TIME)";
    const inputData = [users_id, currentDate];

    const [queryResponse] = await promisePool.query(punchInQuery, inputData);

    return res.status(200).json({
      success: true,
      message: "Punched in successfully!",
      queryResponse,
    });
  } catch (error) {
    console.error("Error in punch-in API:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const punchOut = async (req, res) => {
  const { attendance_id } = req.body;
  try {
    if (!attendance_id) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance ID is missing!" });
    }

    const time = new Date();

    const punchInStartTime = new Date();
    punchInStartTime.setHours(9, 0, 0, 0);

    const punchInEndTime = new Date();
    punchInEndTime.setHours(18, 0, 0, 0);

    if (time < punchInStartTime || time > punchInEndTime) {
      return res.status(400).json({
        success: false,
        message: "You can only punch in between 9:00 AM and 6:00 PM.",
      });
    }

    const isAttendanceMakedAlready =
      "SELECT * FROM attendence WHERE attendance_id = ?";
    const [attenderQuery] = await promisePool.query(isAttendanceMakedAlready, [
      attendance_id,
    ]);

    if (attenderQuery.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    const currentDate = getCurrentDate();

    const punchOutQuery =
      "UPDATE attendence SET punch_out = CURRENT_TIME WHERE DATE(punch_date) = ?";
    const [runPunchOutQuery] = await promisePool.query(punchOutQuery, [
      currentDate,
    ]);

    return res.status(200).json({
      success: true,
      data: "punch-out successfully!",
      runPunchOutQuery,
    });
  } catch (error) {
    console.error("Error in punch-out API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const retrivePuncingstatus = async (req, res) => {
  const { usersId } = req.params;
  try {
    if (!usersId) {
      return res
        .status(404)
        .json({ success: false, message: "User ID is missing" });
    }
    const currentDate = new Date();

    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    const isAttendanceExists =
      "SELECT * FROM attendence WHERE users_id = ? AND punch_date BETWEEN ? AND ?";

    const [runAttendanceGetQuery] = await promisePool.query(
      isAttendanceExists,
      [usersId, startOfDay, endOfDay]
    );

    if (runAttendanceGetQuery.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance exists for today",
      });
    }

    return res.status(200).json({
      success: true,
      attendenceStatus: runAttendanceGetQuery,
    });
  } catch (error) {
    console.error("Error in attendance API : ", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const applyforLeave = async (req, res) => {
  const { users_id, leave_type, start_date, end_date, reason } = req.body;
  try {
   
    if (!users_id || !leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: "Fields are missing!" });  
    }

    // Check if user exists
    const isUserCheckQuery = "SELECT * FROM users WHERE user_id=?";
    const [isExistUser] = await promisePool.query(isUserCheckQuery, users_id);

    if (isExistUser.length === 0) { 
      return res.status(404).json({ success: false, message: "User does not exist!" });
    }

    
    const leaveInsertQuery =
      "INSERT INTO employeesLeaves(users_id, leave_type, start_date, end_date, reason) VALUES(?,?,?,?,?)";  // fixed the typo here
    const leaveInputData = [users_id, leave_type, start_date, end_date, reason];

    const applyForLeaveQuery = await promisePool.query(
      leaveInsertQuery,
      leaveInputData
    );

    // Respond with success message
    res.status(200).json({ success: true, message: "Leave request applied successfully", applyForLeaveQuery });
    
  } catch (error) {
    console.error("Error in LEAVE_REQUEST API:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

module.exports = { punchIn, punchOut, retrivePuncingstatus,applyforLeave };
