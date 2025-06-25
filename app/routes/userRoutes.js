const express = require("express")
const routes = express.Router()
const {userRegister,addOrUpdateEmployeeFullDetails,login,loggedOut,refreshAccessToken, authInfoRetrive}= require("../controllers/userController.js")
const { verifyToken } = require("../middleware/authMiddleware.js")


//-------------->>> new user registraion  routes 
routes.post("/register",userRegister)

//-------------->>> add complete profile 
routes.post("/completeProfile",verifyToken,addOrUpdateEmployeeFullDetails)

//-------------->>> login user routes 
routes.post("/login",login)

//-------------->>> logged out routes 
routes.post("/logout",verifyToken ,loggedOut)

//-------------->>> logged out routes 
routes.post("/refreshtoken",refreshAccessToken)

//-------------->>> logged out routes 
routes.get("/authinfo",verifyToken,authInfoRetrive)


module.exports = routes