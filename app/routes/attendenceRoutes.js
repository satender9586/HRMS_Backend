const express = require("express")
const router = express.Router()
const {punchIn} = require("../controllers/attendenceController.js")

router.post("/check_in" ,punchIn)

module.exports = router