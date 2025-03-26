const { promisePool } = require("../config/dbConnected.js");

const punchIn = async (req, res) => {
  //users_id,date,hours_worked,
  // status ENUM('Present', 'Absent', 'Late', 'On Leave') DEFAULT 'Absent',
  const { users_id } = req.body;
  try {
    if (!users_id) {
      res.status(404).json({ success: false, message: "userId is missing!" });
    }

    const userfindQuery = "SELECT * FROM users WHERE user_id = ?";
    const [userExists] = await promisePool.query(userfindQuery, users_id);

    if (!userExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists!",
      });
    }

    const punchInQuery = ''

    res.status(200).json({ message: false });
  } catch (error) {}
};

module.exports = { punchIn };
