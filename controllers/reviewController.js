const mongoose = require("mongoose"); 
const Review = require("../models/Review");
const User = require("../models/User");

const createReview = async (req, res) => {
    try {
        const { toolId, targetUserId, rating, comment } = req.body;

        if (!toolId || !targetUserId || !rating) {
            return res.status(400).json({ message: "Faltan datos obligatorios para la reseña" });
        }

        // 1. Guardar la nueva reseña numérica para estadísticas
        const newReview = new Review({
            tool: toolId,
            fromUser: req.user._id,
            targetUserId: targetUserId,
            rating: Number(rating),
            comment
        });
        await newReview.save();

        // 2. Calcular el nuevo promedio de reputación usando Aggregate
        const stats = await Review.aggregate([
            { 
                $match: { targetUserId: new mongoose.Types.ObjectId(targetUserId) } 
            },
            { 
                $group: { 
                    _id: null, 
                    averageRating: { $avg: "$rating" } 
                } 
            }
        ]);

        const newAverage = stats.length > 0 ? stats[0].averageRating : null;

        // 3. Determinar el estado del usuario basado en su nueva reputación
        let newStatus = "Activo";
        if (newAverage !== null && newAverage < 2.0) {
            newStatus = "Suspendido";
        }

        // 4. Actualizar al usuario calificado
        await User.findByIdAndUpdate(targetUserId, { 
            reputation: newAverage,
            status: newStatus 
        });

        res.status(201).json({ 
            message: "Reseña guardada y reputación actualizada", 
            newAverage,
            status: newStatus 
        });
        
    } catch (error) {
        console.error("Error en createReview:", error);
        res.status(500).json({ message: "Error interno al guardar la reseña", error: error.message });
    }
};

module.exports = { createReview };