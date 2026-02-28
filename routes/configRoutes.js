const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const Location = require("../models/Location");

// Endpoint para obtener categorías
router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ categories });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener categorías", error });
    }
});

// Endpoint para obtener locaciones
router.get("/locations", async (req, res) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json({ locations });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener locaciones", error });
    }
});

module.exports = router;