const express = require("express")
const { applyforLeave,approveLeaveRequest,retriveMyAllLeaves,allocateLeaves, listAllLeaveApplications  } = require("../controllers/leaveController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = express.Router()

router.post("/leave-request" ,verifyToken,applyforLeave)
router.post("/approve-leave/:leave_request_id", verifyToken, approveLeaveRequest)
router.get("/myleaves", verifyToken, retriveMyAllLeaves)
router.get("/allleaves", verifyToken, listAllLeaveApplications)
router.post("/allocateleave", verifyToken, allocateLeaves)





module.exports = router