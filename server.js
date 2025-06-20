const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");  
const morgan = require("morgan");  
const dotenv = require("dotenv").config();
const colors = require('colors');
const app = express();
const { verifyToken } = require("./app/middleware/authMiddleware.js")
const { funDb } = require("./app/config/dbConnected.js")
const  userRoutes = require("./app/routes/userRoutes.js")
const  attendenceRoutes =  require("./app/routes/attendenceRoutes.js")
const holidaysRoutes = require("./app/routes/holidaysRoutes.js")
const adminRoutes = require("./app/routes/adminRoutes.js")
const leaveRoutes = require("./app/routes/leaveRoutes.js")


//-------------> CONFIG
funDb()
//-------------> MIDDLEWARE 

app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser())
app.use(morgan('dev')); 
app.use("/api/v1/auth",userRoutes)
app.use("/api/v1/attendence",verifyToken,attendenceRoutes)
app.use("/api/v1/holiday",verifyToken ,holidaysRoutes)
app.use("/api/v1/admin",verifyToken,adminRoutes)
app.use("/api/v1/leave",verifyToken,leaveRoutes)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(colors.yellow(`Server running on port: ${PORT}`));
});
