const express = require("express")
const {addHolidays} = require("../controllers/holidayController.js")
const routes = express.Router()

routes.post("/addHolidays", addHolidays)


module.exports = routes