const { promisePool } = require("../config/dbConnected");

const addHolidays = async (req, res) => {
  const { holiday_name, description, start_date, end_date } = req.body;

  try {
    
    if (!holiday_name || !description || !start_date || !end_date) {
      const error = new ApiError(400, "Some required fields are missing!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
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
      const error = new ApiError(400, "Holiday already exists for the given period!");
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        data: error.data,
      });
    }

    
    const addHolidaysQuery = `
      INSERT INTO official_holidays (holiday_name, description, start_date, end_date) 
      VALUES (?, ?, ?, ?)
    `;
    const addHolidaysValue = [holiday_name, description, start_date, end_date];

    const [runAddHolidaysQuery] = await promisePool.query(addHolidaysQuery, addHolidaysValue);

    const response = new ApiResponse(200, runAddHolidaysQuery, "Holiday added successfully!");
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
    });

  } catch (error) {
    console.error("Error in ADD Holiday API:", error);
    const err = new ApiError(500, "Something went wrong!", error);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }
};


module.exports = { addHolidays };
