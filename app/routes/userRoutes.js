const express = require("express")
const routes = express.Router()
const {userRegister,addEmployeeBasicPersonalDetails,addEmployeeContactDetails,addEmployeeBankDetails,addOrUpdateEmployeeFullDetails,loginApi,loggedOut,refreshAccessToken, authInfoRetrive}= require("../controllers/userController.js")
const { verifyToken } = require("../middleware/authMiddleware.js")


//-------------->>> new user registraion  routes 
routes.post("/register",userRegister)

//-------------->>> new user registraion  routes 
routes.put("/peronal-details",verifyToken,addEmployeeBasicPersonalDetails)

//-------------->>> new user registraion  routes 
routes.put("/contact-details",verifyToken,addEmployeeContactDetails)

//-------------->>> new user registraion  routes 
routes.put("/bank-details",verifyToken,addEmployeeBankDetails)
//-------------->>> new user registraion  routes 
routes.post("/completeProfile",verifyToken,addOrUpdateEmployeeFullDetails)

//-------------->>> login user routes 
routes.post("/login",loginApi)

//-------------->>> logged out routes 
routes.post("/logout",verifyToken ,loggedOut)

//-------------->>> logged out routes 
routes.post("/refreshtoken",refreshAccessToken)

//-------------->>> logged out routes 
routes.get("/authinfo",verifyToken,authInfoRetrive)


module.exports = routes