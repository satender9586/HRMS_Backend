const { promisePool } = require("../config/dbConnected.js");
const jwt = require("jsonwebtoken")


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
      "SELECT * FROM employees WHERE email = ?",
      [email]
    );

    if (userExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists!",
      });
    }

   
    const [result] = await promisePool.query(
      "INSERT INTO employees (email, password, role, department) VALUES (?, ?, ?, ?)",
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

// login API


const loginApi = async (req, res) => {
  const { email, password } = req.body;
  console.log(password)

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "email is missing!" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "password is missing!" });
    }

    const checkUserExistsQuery = 'SELECT * FROM employees WHERE email = ?';
    const [rows] = await promisePool.query(checkUserExistsQuery, [email]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(400).json({ success: false, message: "Wrong password!" });
    }

    if (user.status !== "Active") {
      return res.status(400).json({ success: false, message: "Inactive account, please contact Admin!" });
    }

    const authToken = jwt.sign(
      { userId: user.user_id, email: user.email,role:user.role },
      process.env.TOKEN_SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ success: true, user, authToken });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong!", error });
  }
};



module.exports = { userRegister,loginApi };
