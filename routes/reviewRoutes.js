const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { createReview } = require("../controllers/reviewController");

const router = express.Router();

// Ruta para crear una reseña (requiere estar logueado)
router.post("/", protect, createReview);

module.exports = router;