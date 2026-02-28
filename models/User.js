const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "El nombre es obligatorio."] },
        username: { type: String, required: [true, "El nombre de usuario es obligatorio."], unique: true },
        email: { 
            type: String, 
            required: [true, "El email es obligatorio."], 
            unique: true,
            match: [/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, "La dirección de email es inválida."]
        },
        password: { type: String, required: [true, "La contraseña es obligatoria."], minlength: 8 },
        phone: { type: String, required: [true, "El teléfono es obligatorio."] },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        status: { 
            type: String, 
            enum: ["Activo", "Suspendido"], 
            default: "Activo" 
        },
        reputation: { 
            type: Number, 
            default: null,
            min: 0,
            max: 5
        },
        isVerified: { type: Boolean, default: false },
        verificationStatus: { type: String, enum: ["Pendiente", "Aprobado", "Rechazado"], default: "Pendiente" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);