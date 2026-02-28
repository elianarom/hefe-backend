const express = require("express");
const { protect, optionalProtect } = require("../middlewares/authMiddleware");
const { getDashboardData, getUserDashboardData, getTools, getToolById, createTool, updateTool, deleteTool, updateToolStatus } = require("../controllers/toolController");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

//Tool Management Routes
router.post("/", protect, upload.array("imgs", 5), createTool);
router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", optionalProtect, getTools);
router.get("/:id", optionalProtect, getToolById);
router.put("/:id", protect, upload.array("imgs", 5), updateTool);
router.delete("/:id", protect, deleteTool);
router.put("/:id/status", protect, updateToolStatus);

module.exports = router;