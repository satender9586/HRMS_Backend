const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");  
const morgan = require("morgan");  
const dotenv = require("dotenv").config();
const colors = require('colors');
const app = express();
const { funDb } = require("./app/config/dbConnected.js")
const  userRoutes = require("./app/routes/userRoutes.js")
const errorHandler = require("./app/middleware/errorHandler.js")

// database
funDb()

// middelware
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(morgan('dev')); 
app.use(errorHandler)
app.use("/api/v1/auth",userRoutes)



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(colors.yellow(`Server running on port: ${PORT}`));
});
