const { promisePool } = require("../config/dbConnected.js");

const userRegister = async (req, res) => {
  // const { email, password, role, department } = req.body;

  // try {
  //   if (!email) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Email is missing!",
  //     });
  //   }
  //   if (!password) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Password is missing!",
  //     });
  //   }
  //   if (!role) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Role is missing!",
  //     });
  //   }
  //   if (!department) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Department is missing!",
  //     });
  //   }
    
  //   const isEmailExists = `SELECT * FROM users WHERE email = ?`;
  //   const [userExists] = await promisePool.query(isEmailExists, email);

  //   if (userExists.length > 0) {
  //     return res.status(400).json({
  //       success: false,
  //       message: "Email already exists!",
  //     });
  //   }

  //   const query = `INSERT INTO users (email, password, role,department) VALUES (?, ?, ?, ?)`;
  //   const values = [email, password, role, department];
  //   const [result] = await promisePool.query(query, values);

  //   return res.status(201).json({
  //     success: true,
  //     message: "user submitted successfully",
  //     data: {id: result.insertId,email }
  //   });


  // } catch (error) {
  //   console.log("Error in register API:", error);
  //   res.status(500).json({
  //     success: false,
  //     message: "Something went wrong!",
  //   });
  // }
};

module.exports = { userRegister };
