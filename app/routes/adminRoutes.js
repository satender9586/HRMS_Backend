const express = require("express")
const { makeEmployeeActiveDeactive } = require("../controllers/adminController")
const router = express.Router()

router.patch("/employeeStatusUpdate",makeEmployeeActiveDeactive)

module.exports = router