require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const toolRoutes = require("./routes/toolRoutes");
const configRoutes = require("./routes/configRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const Category = require("./models/Category");
const Location = require("./models/Location");

const app = express();

//Middleware to handle CORS
app.use(
    cors({
        origin: process.env.URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

//Connect Database
connectDB();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tools", toolRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", configRoutes);
app.use("/api/review", reviewRoutes);

//Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server funcionando en el puerto ${PORT}`));

const seedDatabase = async () => {
    try {
        const categories = ["Manuales", "Eléctricas", "Jardín", "Carpintería", "Automotor", "Medición", "Otros"];
        const locations = ["Nuñez", "Belgrano", "Coghlan", "Villa Urquiza", "Palermo", "Recoleta", "Colegiales"];

        for (const name of categories) {
            await Category.findOneAndUpdate({ name }, { name }, { upsert: true });
        }

        for (const name of locations) {
            await Location.findOneAndUpdate({ name }, { name }, { upsert: true });
        }
        
        console.log("✅ Categorías y Locaciones sincronizadas.");
    } catch (err) {
        console.error("❌ Error en el seeding:", err);
    }
};

// Ejecutar la sincronización al iniciar
seedDatabase();