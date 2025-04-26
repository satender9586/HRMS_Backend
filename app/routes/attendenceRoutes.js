const express = require("express")
const router = express.Router()
const {punchIn,punchOut,retrivePuncingstatus,applyforLeave,retriveAttendence} = require("../controllers/attendenceController.js")

// punch in method
router.post("/check_in" ,punchIn)

// punch out method
router.patch("/check_out" ,punchOut)

// punch out method
router.get("/punchstatus/:usersId" ,retrivePuncingstatus)

// punch out method
router.post("/leave-request" ,applyforLeave)

// retrive attendence
router.post("/retrive_attendence" ,retriveAttendence)

module.exports = router