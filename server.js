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

app.use(cors({
    origin: ["https://hefe.com.ar", "https://www.hefe.com.ar"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Respuesta manual para el "Preflight"
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://hefe.com.ar');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204);
});

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
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server funcionando en el puerto ${PORT}`));

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









