const { promisePool } = require("../config/dbConnected.js");
const {triggerQuery,dropTriggerIfExists} = require("../helper/dbQueries.js")
const { getCurrentDate } = require("../lib/function.js");

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
        punchData : alreadyPunched[0],
        currentDate,
      });
    }
    const punchInQuery = 
    "INSERT INTO attendence(users_id, punch_date, punch_in) VALUES(?, ?, CURRENT_TIME)";
  const inputData = [users_id, currentDate];
  const [queryResponse] = await promisePool.query(punchInQuery, inputData);

  const newAttendanceId = queryResponse.insertId;
  
  const getPunchindata = "SELECT * FROM attendence WHERE attendance_id = ?";
  const [getPunchStatus] = await promisePool.query(getPunchindata, [newAttendanceId]);
  
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

    // if (time < punchInStartTime || time > punchInEndTime) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "You can only punch in between 9:00 AM and 6:00 PM.",
    //   });
    // }

    const isAttendanceMakedAlready = "SELECT * FROM attendence WHERE users_id = ? AND DATE(punch_date) = ?";
     const [attenderQuery] = await promisePool.query(isAttendanceMakedAlready, [
      users_id,
      currentDate
    ]);

  
    // if (attenderQuery.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Attendance record not found." });
    // }



    const punchOutQuery ="UPDATE attendence SET punch_out = CURRENT_TIME WHERE  users_id = ? AND DATE(punch_date) = ?";
     const [runPunchOutQuery] = await promisePool.query(punchOutQuery, [
      users_id,
      currentDate,
    ]);

    if(runPunchOutQuery.affectedRows==0){
       return res.status(400).json({success:false, message:"PunchOut time not updated!"})
    }

    setTimeout(async()=>{
      const [punchouttrigger] = await promisePool.query(triggerQuery)
      console.log("puch trigger", punchouttrigger)
    },[2000])

   


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
        data:0
      });
    }

    return res.status(200).json({
      success: true,
      message:"Puching status data",
      data:1,
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
  const { users_id, leave_type, start_date, end_date, description } = req.body;
  try {
    if (!users_id || !leave_type || !start_date || !end_date) {
      return res
        .status(400)
        .json({ success: false, message: "Fields are missing!" });
    }

    const isUserCheckQuery = "SELECT * FROM users WHERE user_id=?";
    const [isExistUser] = await promisePool.query(isUserCheckQuery, users_id);

    if (isExistUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist!" });
    }

    // also check user already take any leave between selected date

    const isLeaveRequestAlreadyQuery = `SELECT * FROM employeesleaves WHERE users_id = ? AND (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)`;
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
      "INSERT INTO employeesLeaves(users_id, leave_type, start_date, end_date,description ) VALUES(?,?,?,?,?)";
    const leaveInputData = [
      users_id,
      leave_type,
      start_date,
      end_date,
      description,
    ];

    const applyForLeaveQuery = await promisePool.query(
      leaveInsertQuery,
      leaveInputData
    );

    // Respond with success message
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

module.exports = { punchIn, punchOut, retrivePuncingstatus, applyforLeave };
