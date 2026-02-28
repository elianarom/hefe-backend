const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createPreference, receiveWebhook } = require("../controllers/paymentController");

// Esta es la ruta que da 404 en tu consola
router.post("/create-preference", protect, createPreference);
router.post("/webhook", receiveWebhook);

module.exports = router;