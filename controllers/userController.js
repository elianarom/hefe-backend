const Tool = require("../models/Tool");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'member' }).select("-password");

        const usersWithTool = await Promise.all(users.map(async (user) => {
            const pendingTools = await Tool.countDocuments({ assignedTo: user._id, status: "Pendiente" });
            const processTools = await Tool.countDocuments({ assignedTo: user._id, status: "Proceso"});
            const aprovedTools = await Tool.countDocuments({ assignedTo: user._id, status: "Aprobada"});
            const rejectedTools = await Tool.countDocuments({ assignedTo: user._id, status: "Rechazada"});

            return {
                ...user._doc,
                pendingTools,
                processTools,
                aprovedTools,
                rejectedTools,
            };
        }));
        res.json(usersWithTool);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

module.exports = { getUsers, getUserById };