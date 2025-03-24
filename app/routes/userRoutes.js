const express = require("express")
const routes = express.Router()
const {userRegister}= require("../controllers/userController.js")


//-------------->>> new user registraion 
routes.post("/register",userRegister)




module.exports = routes