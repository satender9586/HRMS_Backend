const express = require("express")
const { applyforLeave,approveLeaveRequest,retriveMyAllLeaves, retriveAllLeaves  } = require("../controllers/leaveController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router()

router.post("/leave-request" ,verifyToken,applyforLeave)
router.post("/approve-leave/:leave_request_id", verifyToken, approveLeaveRequest)
router.get("/myleaves", verifyToken, retriveMyAllLeaves)
router.get("/allleaves", verifyToken, retriveAllLeaves)





module.exports = router