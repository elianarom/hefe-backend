const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
    tool: { type: mongoose.Schema.Types.ObjectId, ref: "Tool", required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysSelected: { type: Number, enum: [3, 5, 7], required: true },
    totalPrice: { type: Number, required: true },
    
    // Status del flujo de alquiler
    status: { 
        type: String, 
        enum: ["Pendiente", "Aprobado", "Entregado", "Finalizado", "Cancelado"], 
        default: "Pendiente" 
    },
    
    // 🔥 CAMBIO CLAVE: Renombrado para coincidir con el Webhook de Mercado Pago
    mercadopagoPaymentId: { type: String }, 
    
    paymentStatus: {
        type: String,
        enum: ['Pendiente', 'Aprobado', 'Rechazado'],
        default: 'Pendiente' 
    },

    // Nuevos campos para notificaciones y control visual
    seen: { type: Boolean, default: false },

    // Reseñas Obligatorias para el cierre
    renterReview: { type: String, default: "" }, 
    ownerReview: { type: String, default: "" }, 

    // Control de flujo de dinero (Billetera)
    moneyReleased: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);