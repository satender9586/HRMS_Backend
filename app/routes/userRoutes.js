const express = require("express")
const routes = express.Router()
const {userRegister,addEmployeeBasicPersonalDetails,addEmployeeContactDetails,addEmployeeBankDetails,loginApi,loggedOut,refreshAccessToken}= require("../controllers/userController.js")
const { verifyToken } = require("../middleware/authMiddleware.js")


//-------------->>> new user registraion  routes 
routes.post("/register",userRegister)

//-------------->>> new user registraion  routes 
routes.post("/peronal-details",verifyToken,addEmployeeBasicPersonalDetails)

//-------------->>> new user registraion  routes 
routes.post("/peronal-details",verifyToken,addEmployeeBasicPersonalDetails)

//-------------->>> new user registraion  routes 
routes.post("/contact-details",verifyToken,addEmployeeContactDetails)

//-------------->>> new user registraion  routes 
routes.post("/bank-details",verifyToken,addEmployeeBankDetails)

//-------------->>> login user routes 
routes.post("/login",loginApi)

//-------------->>> logged out routes 
routes.post("/logout",verifyToken ,loggedOut)

//-------------->>> logged out routes 
routes.post("/refreshtoken",refreshAccessToken)


module.exports = routes