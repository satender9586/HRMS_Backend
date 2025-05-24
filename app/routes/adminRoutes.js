const express = require("express")
const { makeEmployeeActiveDeactive,retriveAllEmployeeList,retriveEmployeeProfiles } = require("../controllers/adminController")
const router = express.Router()

router.patch("/employeeStatusUpdate",makeEmployeeActiveDeactive)

router.get("/retriveEmployees",retriveAllEmployeeList)

router.get("/retriveEmployeeProfile/:empId",retriveEmployeeProfiles)

module.exports = router