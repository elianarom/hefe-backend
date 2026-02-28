const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile, changePassword, verifyUser } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const router = express.Router();

//Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changePassword);
router.put("/verify-user/:id", protect, verifyUser);

router.post("/upload-image", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo"});
    
    // Devuelve solo el nombre del archivo
    res.status(200).json({ imageName: req.file.filename }); 
});

module.exports = router;