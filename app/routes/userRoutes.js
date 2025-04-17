const express = require("express")
const routes = express.Router()
const {userRegister,loginApi}= require("../controllers/userController.js")


//-------------->>> new user registraion 
routes.post("/register",userRegister)

//-------------->>> login user API 
routes.post("/login",loginApi)


module.exports = routes