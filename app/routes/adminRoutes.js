const express = require("express")
const { makeEmployeeActiveDeactive,retriveAllEmployeeList } = require("../controllers/adminController")
const router = express.Router()

router.patch("/employeeStatusUpdate",makeEmployeeActiveDeactive)

router.get("/retriveEmployees",retriveAllEmployeeList)

module.exports = router