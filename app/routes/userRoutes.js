const express = require("express")
const routes = express.Router()
const {userRegister,loginApi,loggedOut,refreshAccessToken}= require("../controllers/userController.js")
const { verifyToken } = require("../middleware/authMiddleware.js")


//-------------->>> new user registraion  routes 
routes.post("/register",userRegister)

//-------------->>> login user routes 
routes.post("/login",loginApi)

//-------------->>> logged out routes 
routes.post("/logout",verifyToken ,loggedOut)
//-------------->>> logged out routes 
routes.post("/refreshtoken",refreshAccessToken)


module.exports = routes