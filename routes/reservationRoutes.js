const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { createReservation, getUserReservationsData, updateReservationStatus, getNotificationCount, markAsSeen, submitReview, finalizeReservation } = require("../controllers/reservationController");

router.get("/notification-count", protect, getNotificationCount);
router.put("/mark-as-seen", protect, markAsSeen);
router.get("/my-reservations", protect, getUserReservationsData);
router.post("/", protect, createReservation);
router.put("/:id/status", protect, updateReservationStatus);
router.put("/:id/review", protect, submitReview);
router.put("/:id/finalize", protect, finalizeReservation);

module.exports = router;