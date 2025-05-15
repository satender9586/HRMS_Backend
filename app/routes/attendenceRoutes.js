const express = require("express")
const router = express.Router()
const {punchIn,punchOut,retrivePuncingstatus,retriveAttendence,getMonthlyAttendanceSummary} = require("../controllers/attendenceController.js")

// punch in method
router.post("/check_in" ,punchIn)

// punch out method
router.patch("/check_out" ,punchOut)

// punch out method
router.get("/punchstatus" ,retrivePuncingstatus)

// retrive attendence
router.get("/retrive_attendence" ,retriveAttendence)
// retrive attendence
router.get("/monthly-summary" ,getMonthlyAttendanceSummary)

module.exports = router