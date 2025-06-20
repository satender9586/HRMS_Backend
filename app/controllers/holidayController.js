const { promisePool } = require("../config/dbConnected");
const { ApiError } = require("../lib/apiError");

const addHolidays = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const role = user?.role;
  const { holiday_name, description, start_date, end_date } = req.body;

  try {
    if (!user || !userId) {
      const error = new ApiError(400, "userId and token missing!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    if (role !== "Super_Admin" && role !== "Admin") {
      const error = new ApiError(400, "You are not an admin or super admin!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

      if (!holiday_name || !description || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Some required fields are missing!",
      });
    }

    const isAlreadyHolidayExists = `
      SELECT * 
      FROM official_holidays 
      WHERE (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)
    `;
    const alreadyHolidayCheckQuery = [start_date, end_date, start_date, end_date];
    const [holidayCheck] = await promisePool.query(isAlreadyHolidayExists, alreadyHolidayCheckQuery);

    if (holidayCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Holiday already exists for the given period!",
      });
    }

    const addHolidaysQuery = `
      INSERT INTO official_holidays (holiday_name, description, start_date, end_date) 
      VALUES (?, ?, ?, ?)
    `;
    const addHolidaysValue = [holiday_name, description, start_date, end_date];
    const [runAddHolidaysQuery] = await promisePool.query(addHolidaysQuery, addHolidaysValue);

    return res.status(200).json({
      success: true,
      message: "Holiday added successfully!",
      data: runAddHolidaysQuery,
    });
  } catch (error) {
    console.error("Error in ADD Holiday API:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

const getHolidays = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const role = user?.role;
  const { year } = req.query;

  try {
    if (!user || !userId) {
      const error = new ApiError(400, "userId and token missing!");
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    

    if (!year || isNaN(year) || year.toString().length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing year! Please provide a 4-digit year.",
      });
    }

    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const query = `
      SELECT
        holiday_id,
        holiday_name,
        description,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
      FROM official_holidays
      WHERE (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)
      ORDER BY start_date ASC
    `;

    const values = [startOfYear, endOfYear, startOfYear, endOfYear];
    const [holidays] = await promisePool.query(query, values);

    return res.status(200).json({
      success: true,
      message: `Holidays for the year ${year} retrieved successfully!`,
      data: holidays,
    });
  } catch (error) {
    console.error("Error in GET Holidays API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching holidays!",
    });
  }
};

const deleteHoliday = async (req, res) => {
  const user = req.user;
  const userId = user?.user_id;
  const role = user?.role;
  const { holidayId } = req.params;

  try {
    if (!user || !userId) {
      return res.status(400).json({ success: false, message: "userId and token missing!" });
    }

    if (role !== "Super_Admin" && role !== "Admin") {
      return res.status(403).json({ success: false, message: "You are not authorized to delete holidays!" });
    }

    if (!holidayId || isNaN(holidayId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing holiday ID.",
      });
    }

    const [result] = await promisePool.query(
      "DELETE FROM official_holidays WHERE holiday_id = ?",
      [holidayId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found or already deleted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Holiday deleted successfully!",
    });
  } catch (error) {
    console.error("Error in DELETE Holiday API:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the holiday!",
    });
  }
};




module.exports = { addHolidays,getHolidays,deleteHoliday };
