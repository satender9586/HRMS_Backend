const express = require("express")
const router = express.Router()
const {punchIn,punchOut,retrivePuncingstatus} = require("../controllers/attendenceController.js")

// punch in method
router.post("/check_in" ,punchIn)

// punch out method
router.patch("/check_out" ,punchOut)

// punch out method
router.get("/punchstatus/:usersId" ,retrivePuncingstatus)

module.exports = router