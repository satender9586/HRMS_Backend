const express = require("express")
const { makeEmployeeActiveDeactive,retriveAllEmployeeList,retriveEmployeeProfiles,makeAnnoucement, getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement, 
  retiveCelebration} = require("../controllers/adminController")
const router = express.Router()

router.patch("/employeeStatusUpdate",makeEmployeeActiveDeactive)
router.get("/retriveEmployees",retriveAllEmployeeList)
router.get("/retriveEmployeeProfile/:empId",retriveEmployeeProfiles)
router.post("/announcement",makeAnnoucement)
router.put("/updateannouncement/:id",updateAnnouncement)
router.delete("/deleteannouncement/:id",deleteAnnouncement)
router.get("/retriveannouncement",getAllAnnouncements)
router.get("/celebration",retiveCelebration)


module.exports = router