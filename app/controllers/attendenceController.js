const { promisePool } = require("../config/dbConnected.js");
const { getCurrentDate } = require("../lib/function.js");

 
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const punchIn = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id;

  try {
    if (!user || !userId || !employee_id) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    const userQuery = "SELECT * FROM employees WHERE employee_id = ?";
    const [userExists] = await promisePool.query(userQuery, [employee_id]);

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist!",
      });
    }

    const currentDate = getCurrentDate();
    const currentDay = new Date(currentDate).getDay(); 


    if (currentDay === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot punch in on a weekend (Sunday)",
      });
    }

    const holidayQuery = `SELECT * FROM official_holidays WHERE ? BETWEEN start_date AND end_date`;
    const [holidayCheck] = await promisePool.query(holidayQuery, [currentDate]);

    if (holidayCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Today is an official holiday. Cannot punch in.",
        holidayInfo: holidayCheck[0],
      });
    }


    const leaveQuery = `SELECT * FROM employee_leaves WHERE employee_id = ? AND ? BETWEEN start_date AND end_date AND status = 'approved'`;
    const [leaveCheck] = await promisePool.query(leaveQuery, [employee_id, currentDate]);

    if (leaveCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You are on approved leave today. Cannot punch in.",
        leaveInfo: leaveCheck[0],
      });
    }

    const alreadyPunchedQuery = `SELECT * FROM attendence WHERE employee_id = ? AND DATE(punch_date) = ? `;
    const [alreadyPunched] = await promisePool.query(alreadyPunchedQuery, [employee_id, currentDate]);
        console.log("insertResult",alreadyPunched)
    if (alreadyPunched.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already punched in today.",
        punchData: alreadyPunched[0],
        currentDate,
      });
    }

    const insertPunchInQuery = `INSERT INTO attendence (employee_id, punch_date, punch_in) VALUES (?, ?, CURRENT_TIME)`;
    const [insertResult] = await promisePool.query(insertPunchInQuery, [employee_id, currentDate]);
    const attendance_id = insertResult.insertId;

    const getPunchDataQuery = "SELECT * FROM attendence WHERE attendance_id = ?";
    const [punchData] = await promisePool.query(getPunchDataQuery, [attendance_id]);

    return res.status(200).json({
      success: true,
      message: "Punched in successfully!",
      punchData: punchData[0],
    });

  } catch (error) {
    console.error("Error in punch-in API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const punchOut = async (req, res) => {
  const user = req.user
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id;


  try {
    if (!userId || !user) {
      return res.status(404).json({ success: false, message: "employee_id missing!" });
    }

    const currentDate = getCurrentDate();

    const isAttendanceMakedAlready = `SELECT * FROM attendence WHERE employee_id = ? AND DATE(punch_date) = ?`;
    const [attenderQuery] = await promisePool.query(isAttendanceMakedAlready, [employee_id,currentDate]);

    
    if (attenderQuery.length === 0) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    const punchOutQuery = `UPDATE attendence SET punch_out = CURRENT_TIME WHERE employee_id = ? AND DATE(punch_date) = ? `;
    await promisePool.query(punchOutQuery, [employee_id, currentDate]);

    const updateHoursWorkedQuery = `UPDATE attendence SET hours_worked = TIMEDIFF(punch_out, punch_in) WHERE employee_id = ? AND DATE(punch_date) = ?`;
    await promisePool.query(updateHoursWorkedQuery, [employee_id, currentDate]);

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

const retrivePuncingstatus  = async (req, res) => {
  const user = req.user;
  const userId = req.user.user_id;
  const employee_id = req.user.employee_id;

  try {
    if (!user || !userId || !employee_id) {
      return res.status(400).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const currentDate = getCurrentDate();
    const currentDay = new Date(currentDate).getDay(); 

    let isHoliday = false;
    let holidayType = null;
    let holidayInfo = null;

 
    if (currentDay === 0) {
      isHoliday = true;
      holidayType = "Weekend";
    }

    const holidayQuery = `SELECT * FROM official_holidays WHERE ? BETWEEN start_date AND end_date`;
    const [holidayCheck] = await promisePool.query(holidayQuery, [currentDate]);

    if (holidayCheck.length > 0) {
      isHoliday = true;
      holidayType = "Official Holiday";
      holidayInfo = holidayCheck[0];
    }


    const leaveQuery = `SELECT * FROM employee_leaves WHERE employee_id = ? AND ? BETWEEN start_date AND end_date AND status = 'approved'`;
    const [leaveCheck] = await promisePool.query(leaveQuery, [employee_id, currentDate]);

    if (leaveCheck.length > 0) {
      isHoliday = true;
      holidayType = "Leave";
      holidayInfo = leaveCheck[0];
    }

  
    const punchStatusQuery = `
      SELECT * FROM attendence
      WHERE employee_id = ? AND DATE(punch_date) = ?
    `;
    const [punchData] = await promisePool.query(punchStatusQuery, [employee_id, currentDate]);

    if (punchData.length === 0) {
      return res.status(400).json({
        success: true,
        message: "No attendance exists for today",
        data: 0,
        isHoliday,
        holidayType,
        holidayInfo,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Punching status found",
      data: 1,
      punchData: punchData[0],
      isHoliday,
      holidayType,
      holidayInfo,
    });

  } catch (error) {
    console.error("Error in retrivePunchingStatus API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// const retriveAttendence = async (req, res) => {
//   const user = req.user;
//   const userId = req.user?.user_id;
//   const employee_id = req.user?.employee_id;

//   try {
//     const { startDate, endDate } = req.query;

//     if (!user || !userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized access. Token or user missing.",
//       });
//     }

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required query parameters: startDate or endDate",
//       });
//     }

//     const query = `
//       SELECT 
//         d.date,
//         a.punch_in,
//         a.punch_out,
//         a.hours_worked,
//         a.status AS attendance_status,
//         l.leave_type,
//         l.reason,
//         l.status AS leave_status,
//         h.holiday_name
//       FROM (
//         SELECT DATE_ADD(?, INTERVAL seq DAY) AS date
//         FROM (
//           SELECT @row := @row + 1 AS seq FROM 
//           (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
//            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
//           (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
//            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
//           (SELECT @row := -1) r
//         ) days
//         WHERE DATE_ADD(?, INTERVAL seq DAY) <= ?
//       ) d
//       LEFT JOIN attendence a
//         ON a.employee_id = ? AND DATE(a.punch_date) = d.date
//       LEFT JOIN employee_leaves l
//         ON l.employee_id = ? AND d.date BETWEEN l.start_date AND l.end_date
//       LEFT JOIN official_holidays h
//         ON h.start_date <= d.date AND h.end_date >= d.date
//       ORDER BY d.date;
//     `;

//     const [rows] = await promisePool.query(query, [
//       startDate,
//       startDate,
//       endDate,
//       employee_id,
//       employee_id,
//     ]);

//     const result = rows.map((row) => {
//       if (row.attendance_status) {
//         return {
//           date: row.date,
//           type: "Present",
//           punch_in: row.punch_in,
//           punch_out: row.punch_out,
//           hours_worked: row.hours_worked,
//           status: row.attendance_status,
//         };
//       } else if (row.leave_type) {
//         return {
//           date: row.date,
//           type: "Leave",
//           leave_type: row.leave_type,
//           reason: row.reason,
//           status: row.leave_status,
//         };
//       } else if (row.holiday_name) {
//         return {
//           date: row.date,
//           type: "Holiday",
//           holiday_name: row.holiday_name,
//           status: "Holiday",
//         };
//       } else {
//         return {
//           date: row.date,
//           type: "Absent",
//           status: "Absent",
//         };
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Attendance data retrieved successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error retrieving attendance:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };
const retriveAttendence = async (req, res) => {
  const user = req.user;
  const userId = req.user?.user_id;
  const employee_id = req.user?.employee_id;

  try {
    const { startDate, endDate } = req.query;

    if (!user || !userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Token or user missing.",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: startDate or endDate",
      });
    }

    const query = `
      SELECT 
        d.date,
        a.punch_in,
        a.punch_out,
        a.hours_worked,
        a.status AS attendance_status,
        h.holiday_name,
        el.leave_type,
        el.start_date AS leave_start_date,
        el.end_date AS leave_end_date
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
        ON a.employee_id = ? AND DATE(a.punch_date) = d.date
      LEFT JOIN official_holidays h
        ON h.start_date <= d.date AND h.end_date >= d.date
      LEFT JOIN employee_leaves el
        ON el.employee_id = ? AND d.date BETWEEN el.start_date AND el.end_date AND el.status = 'approved'
      ORDER BY d.date;
    `;

    const [rows] = await promisePool.query(query, [
      startDate,
      startDate,
      endDate,
      employee_id,
      employee_id
    ]);

    const result = rows.map((row) => {
      const date = new Date(row.date);
      const isWeekend = date.getDay() === 0; 

      // If leave is approved, mark attendance as "Leave"
      if (row.leave_type) {
        return {
          date: row.date,
          type: "Leave",
          leave_type: row.leave_type,
          status: "Leave",
        };
      }

      // If there is attendance data (Present)
      if (row.attendance_status) {
        return {
          date: row.date,
          type: "Present",
          status: row.attendance_status,
          punch_in: row.punch_in,
          punch_out: row.punch_out,
          hours_worked: row.hours_worked,
        };
      }

      // If it's a holiday
      else if (row.holiday_name) {
        return {
          date: row.date,
          type: "Holiday",
          holiday_name: row.holiday_name,
          status: "Holiday",
        };
      }

      // If it's a weekend or absent day
      else {
        return {
          date: row.date,
          type: isWeekend ? "Weekend" : "Absent",
          status: isWeekend ? "Weekend" : "Absent",
          message: isWeekend ? "This is a weekend (Sunday)." : null,
        };
      }
    });

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

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.employee_id) {
      return res.status(401).json({ success: false, message: "Unauthorized or invalid user." });
    }

    const employee_id = user.employee_id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required query parameters: startDate or endDate",
      });
    }

    const formatDate = (date) => date.toISOString().split('T')[0];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = formatDate(start);
    const endStr = formatDate(end);

 
    const [attendanceSummary] = await promisePool.query(`
      SELECT status, COUNT(*) AS count
      FROM attendence
      WHERE employee_id = ?
        AND DATE(punch_date) BETWEEN ? AND ?
      GROUP BY status
    `, [employee_id, startStr, endStr]);


    const [attendanceDatesRows] = await promisePool.query(`
      SELECT DATE(punch_date) AS date
      FROM attendence
      WHERE employee_id = ?
        AND DATE(punch_date) BETWEEN ? AND ?
    `, [employee_id, startStr, endStr]);

    const attendanceDates = new Set(attendanceDatesRows.map(row => formatDate(new Date(row.date))));


    const [leaveRows] = await promisePool.query(`
      SELECT start_date, end_date
      FROM employee_leaves
      WHERE employee_id = ?
        AND status = 'Approved'
        AND (
          (start_date BETWEEN ? AND ?) OR
          (end_date BETWEEN ? AND ?) OR
          (start_date <= ? AND end_date >= ?)
        )
    `, [employee_id, startStr, endStr, startStr, endStr, startStr, endStr]);

    const leaveDates = new Set();
    for (const row of leaveRows) {
      const leaveStart = new Date(row.start_date) < start ? new Date(start) : new Date(row.start_date);
      const leaveEnd = new Date(row.end_date) > end ? new Date(end) : new Date(row.end_date);
      for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
        leaveDates.add(formatDate(new Date(d)));
      }
    }

    // Get official holidays
    const [holidayRows] = await promisePool.query(`
      SELECT start_date, end_date
      FROM official_holidays
      WHERE start_date <= ? AND end_date >= ?
    `, [endStr, startStr]);

    const officialHolidayDates = new Set();
    for (const row of holidayRows) {
      const holidayStart = new Date(row.start_date) < start ? new Date(start) : new Date(row.start_date);
      const holidayEnd = new Date(row.end_date) > end ? new Date(end) : new Date(row.end_date);
      for (let d = new Date(holidayStart); d <= holidayEnd; d.setDate(d.getDate() + 1)) {
        officialHolidayDates.add(formatDate(new Date(d)));
      }
    }

   
    const weekendDates = new Set();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const current = new Date(d); 
      if (current.getDay() === 0) {
        const dateStr = formatDate(current);
        weekendDates.add(dateStr);
      }
    }

  
    const result = {
      Present: 0,
      Absent: 0,
      Leave: leaveDates.size,
      Halfday: 0,
      Weekend: 0,
      OfficialHoliday: officialHolidayDates.size,
    };

 
    attendanceSummary.forEach(row => {
      if (row.status === 'Leave') return;
      if (result.hasOwnProperty(row.status)) {
        result[row.status] += row.count;
      }
    });


    for (const date of weekendDates) {
      if (
        !attendanceDates.has(date) &&
        !leaveDates.has(date) &&
        !officialHolidayDates.has(date)
      ) {
        result.Weekend += 1;
      }
    }


    let totalAbsent = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(new Date(d));
      if (
        !attendanceDates.has(dateStr) &&
        !leaveDates.has(dateStr) &&
        !officialHolidayDates.has(dateStr) &&
        !weekendDates.has(dateStr)
      ) {
        totalAbsent += 1;
      }
    }
    result.Absent = totalAbsent;

    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error("Error in monthly summary API:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while generating summary.",
      error: error.message
    });
  }
};

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>





module.exports = {
  punchIn,
  punchOut,
  retrivePuncingstatus,
  retriveAttendence,
  getMonthlyAttendanceSummary
};
