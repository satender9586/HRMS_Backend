const express = require("express")
const {addHolidays,getHolidays} = require("../controllers/holidayController.js")
const routes = express.Router()

routes.post("/addHolidays", addHolidays)
routes.get("/retriveHolidays/:year", getHolidays);


module.exports = routes