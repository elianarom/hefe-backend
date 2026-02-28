const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log("Mongo DB conectado!! :)");
    } catch (err) {
        console.error("Error al conectar Mongo DB :(", err);
        process.exit(1);
    }
};

module.exports = connectDB;