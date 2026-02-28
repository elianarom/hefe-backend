const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "El título de la herramienta es obligatorio."],
            trim: true
        },
        description: {
            type: String,
            required: [true, "La descripción de la herramienta es obligatoria."]
        },
        price3: {
            type: Number,
            required: [true, "El precio por 3 días es obligatorio."],
            min: [0, "El precio no puede ser negativo"],
            default: 0
        },
        price5: {
            type: Number,
            required: [true, "El precio por 5 días es obligatorio."],
            min: [0, "El precio no puede ser negativo"],
            default: 0
        },
        price7: {
            type: Number,
            required: [true, "El precio por 7 días es obligatorio."],
            min: [0, "El precio no puede ser negativo"],
            default: 0
        },
        productLink: {
            type: String,
            default: ""
        },
        category: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Category" 
        }],
        location: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Location" 
        }],
        imgs: [{ type: String }], // Array de nombres de archivos
        adminComments: { 
            type: String, 
            default: "" 
        },
        status: { 
            type: String, 
            enum: ["Pendiente", "Proceso", "Aprobado", "Rechazado"], 
            default: "Pendiente" 
        },
        createdBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User",
            required: true 
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema);