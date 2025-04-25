const { promisePool } = require("../config/dbConnected");

const addHolidays = async (req, res) => {
  const { holiday_name, description, start_date, end_date } = req.body;

  try {
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
    const alreadyHolidayCheckQuery = [
      start_date,
      end_date,
      start_date,
      end_date,
    ];
    const [holidayCheck] = await promisePool.query(
      isAlreadyHolidayExists,
      alreadyHolidayCheckQuery
    );

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

    const [runAddHolidaysQuery] = await promisePool.query(
      addHolidaysQuery,
      addHolidaysValue
    );

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

module.exports = { addHolidays };
