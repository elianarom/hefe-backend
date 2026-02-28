const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const { getUsers, getUserById } = require("../controllers/userController");
const { verifyUser } = require("../controllers/authController")

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.get("/:id", protect, getUserById);
router.put("/verify/:id", protect, adminOnly, verifyUser);

module.exports = router;