const { promisePool } = require("../config/dbConnected");

const addHolidays = async (req, res) => {
  const { holiday_name, description, start_date, end_date } = req.body;

  try {
    // Check if all required fields are provided
    if (!holiday_name || !description || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Some required fields are missing!",
      });
    }

    // Check if the holiday already exists in the given period
    const isAlreadyHolidayExists = `
      SELECT * 
      FROM holidays 
      WHERE (start_date BETWEEN ? AND ? OR end_date BETWEEN ? AND ?)
    `;
    const alreadyHolidayCheckQuery = [
      start_date,
      end_date,
      start_date,
      end_date,
    ];

    // Query execution to check for overlapping holidays
    const [holidayCheck] = await promisePool.query(
      isAlreadyHolidayExists,
      alreadyHolidayCheckQuery
    );

    // If there is an overlapping holiday, return error
    if (holidayCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Holiday already exists for the given period!",
      });
    }

    // Insert new holiday into the database
    const addHolidaysQuery = `
      INSERT INTO holidays (holiday_name, description, start_date, end_date) 
      VALUES (?, ?, ?, ?)
    `;
    const addHolidaysValue = [
      holiday_name,
      description,
      start_date,
      end_date,
    ];

    // Execute the query to insert the new holiday
    const [runAddHolidaysQuery] = await promisePool.query(
      addHolidaysQuery,
      addHolidaysValue
    );

    // Return success message
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
