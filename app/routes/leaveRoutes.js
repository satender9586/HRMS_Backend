const express = require("express")
const { leaveRequest,LeaveAction,retriveMyAllLeaves,allocateLeaves, listAllLeaveApplications,allocatedLeaveSummary  } = require("../controllers/leaveController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router()

router.post("/leave-request" ,verifyToken,leaveRequest)
router.post("/approve-leave/:leave_request_id", verifyToken, LeaveAction)
router.get("/myleaves", verifyToken, retriveMyAllLeaves)
router.get("/allleaves", verifyToken, listAllLeaveApplications)
router.post("/allocateleave", verifyToken, allocateLeaves)
router.get("/leave-balance/:leave_name", verifyToken, allocatedLeaveSummary)





module.exports = router