const express = require("express")
const {addHolidays,getHolidays,deleteHoliday} = require("../controllers/holidayController.js")
const routes = express.Router()

routes.post("/addHolidays", addHolidays)
routes.get("/retriveHolidays/:year", getHolidays);
routes.delete("/deleteholidays/:holidayId", deleteHoliday);


module.exports = routes