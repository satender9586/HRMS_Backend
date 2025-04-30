const { promisePool } = require("../config/dbConnected.js");
const {
  getCurrentDate,
  getDateRange,
  formatDate,
  filterDataBaseOnDates,
  attendeData,
} = require("../lib/function.js");

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const punchIn = async (req, res) => {
  const { users_id } = req.body;

  try {
    if (!users_id) {
      return res
        .status(404)
        .json({ success: false, message: "userId is missing!" });
    }

    const userfindQuery = "SELECT * FROM employees WHERE user_id = ?";
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
        punchData: alreadyPunched[0],
        currentDate,
      });
    }
    const punchInQuery =
      "INSERT INTO attendence(users_id, punch_date, punch_in) VALUES(?, ?, CURRENT_TIME)";
    const inputData = [users_id, currentDate];
    const [queryResponse] = await promisePool.query(punchInQuery, inputData);

    const newAttendanceId = queryResponse.insertId;

    const getPunchindata = "SELECT * FROM attendence WHERE attendance_id = ?";
    const [getPunchStatus] = await promisePool.query(getPunchindata, [
      newAttendanceId,
    ]);

    return res.status(200).json({
      success: true,
      message: "Punched in successfully!",
      punchData: getPunchStatus[0],
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
  const { users_id } = req.body;

  try {
    if (!users_id) {
      return res
        .status(404)
        .json({ success: false, message: "users_id missing!" });
    }

    const time = new Date();

    const punchInStartTime = new Date();
    punchInStartTime.setHours(9, 0, 0, 0);

    const punchInEndTime = new Date();
    punchInEndTime.setHours(18, 0, 0, 0);

    const currentDate = getCurrentDate();

    const isAttendanceMakedAlready = `
      SELECT * FROM attendence 
      WHERE users_id = ? AND DATE(punch_date) = ?
    `;

    const [attenderQuery] = await promisePool.query(isAttendanceMakedAlready, [
      users_id,
      currentDate,
    ]);

    // Optional: Uncomment to require attendance to exist before punch-out
    if (attenderQuery.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found." });
    }

    const punchOutQuery = `UPDATE attendence SET punch_out = CURRENT_TIME WHERE users_id = ? AND DATE(punch_date) = ? `;
    await promisePool.query(punchOutQuery, [users_id, currentDate]);

    const updateHoursWorkedQuery = `
    UPDATE attendence 
    SET hours_worked = TIMEDIFF(punch_out, punch_in) 
    WHERE users_id = ? AND DATE(punch_date) = ?
  `;
    await promisePool.query(updateHoursWorkedQuery, [users_id, currentDate]);

    return res.status(200).json({
      success: true,
      message: "Punch-out successful and hours updated!",
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
        data: 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Puching status data",
      data: 1,
      punchData: runAttendanceGetQuery[0],
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
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    const isUserCheckQuery = "SELECT * FROM employees WHERE user_id=?";
    const [isExistUser] = await promisePool.query(isUserCheckQuery, users_id);

    if (isExistUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }
    const isLeaveRequestAlreadyQuery = `SELECT * FROM employee_leaves WHERE users_id = ? AND (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)`;

    const leaveRequestDate = [
      users_id,
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

    const leaveInsertQuery =
      "INSERT INTO employee_leaves(users_id, leave_type, start_date, end_date, reason) VALUES(?,?,?,?,?)";
    const leaveInputData = [users_id, leave_type, start_date, end_date, reason];

    const [applyForLeaveQuery] = await promisePool.query(
      leaveInsertQuery,
      leaveInputData
    );

    res.status(200).json({
      success: true,
      message: "Leave request applied successfully",
      applyForLeaveQuery,
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

const retriveAttendence = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: userId, startDate, or endDate",
      });
    }

    const query = `
      SELECT 
        d.date,
        a.punch_in,
        a.punch_out,
        a.hours_worked,
        a.status AS attendance_status,
        l.leave_type,
        l.reason,
        l.status AS leave_status,
        h.holiday_name
      FROM (
        SELECT DATE_ADD(?, INTERVAL seq DAY) AS date
        FROM (
          SELECT @row := @row + 1 AS seq FROM 
          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
           UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
          (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
           UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
          (SELECT @row := -1) r
        ) days
        WHERE DATE_ADD(?, INTERVAL seq DAY) <= ?
      ) d
      LEFT JOIN attendence a
        ON a.users_id = ? AND DATE(a.punch_date) = d.date
      LEFT JOIN employee_leaves l
        ON l.users_id = ? AND d.date BETWEEN l.start_date AND l.end_date
      LEFT JOIN official_holidays h
        ON h.start_date <= d.date AND h.end_date >= d.date
      ORDER BY d.date;
    `;

    const [rows] = await promisePool.query(query, [
      startDate,
      startDate,
      endDate,
      userId,
      userId,
    ]);

    const result = rows.map((row) => {
      if (row.attendance_status) {
        return {
          date: row.date,
          type: "Present",
          punch_in: row.punch_in,
          punch_out: row.punch_out,
          hours_worked: row.hours_worked,
          status: row.attendance_status,
        };
      } else if (row.leave_type) {
        return {
          date: row.date,
          type: "Leave",
          leave_type: row.leave_type,
          reason : row.reason,
          status: row.leave_status,
        };
      } else if (row.holiday_name) {
        return {
          date: row.date,
          type: "Holiday",
          holiday_name: row.holiday_name,
          status:"Holiday"
        };
      } else {
        return {
          date: row.date,
          type: "Absent",
          status:"Absent"
        };
      }
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Attendance data retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error retrieving attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  punchIn,
  punchOut,
  retrivePuncingstatus,
  applyforLeave,
  retriveAttendence,
};
