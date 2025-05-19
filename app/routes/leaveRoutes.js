const express = require("express")
const { applyforLeave,approveLeaveRequest,retriveMyAllLeaves  } = require("../controllers/leaveController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router()

// punch out method
router.post("/leave-request" ,applyforLeave)
// punch out method
router.patch("/approve-leave/:leave_request_id", verifyToken, approveLeaveRequest)
// punch out method
router.get("/myleaves", verifyToken, retriveMyAllLeaves)





module.exports = router