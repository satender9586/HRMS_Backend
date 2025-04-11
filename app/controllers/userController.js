const { promisePool } = require("../config/dbConnected.js");

const userRegister = async (req, res) => {
  const { email, password, role, department } = req.body;

  try {

    if (!email || !password || !role || !department) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: email, password, role, department",
      });
    }

    const [userExists] = await promisePool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists!",
      });
    }

   
    const [result] = await promisePool.query(
      "INSERT INTO users (email, password, role, department) VALUES (?, ?, ?, ?)",
      [email, password, role, department]
   
    );

    if (result.affectedRows === 1) {
      return res.status(201).json({
        success: true,
        message: "User registered successfully!",
        data: {
          id: result.insertId,
          email,
          role,
          department,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
    });

  } catch (error) {
    console.error("Error in register API:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

module.exports = { userRegister };
