const Tool = require("../models/Tool");
const User = require("../models/User");

const getTools = async (req, res) => {
    try {
        const { status, category, location, myTools } = req.query; 
        let filter = {};

        // 1. LÓGICA DE FILTRO CORREGIDA
        if (req.user && req.user.role === "admin") {
            // El admin puede filtrar por cualquier estado, o ver todos si no se manda nada
            if (status && status !== "All") filter.status = status;
        } 
        else if (myTools === "true" && req.user) {
            // Caso: Usuario normal viendo SUS herramientas
            filter.createdBy = req.user._id;
            if (status && status !== "All") filter.status = status;
        } 
        else {
            // CATÁLOGO PÚBLICO: Solo herramientas aprobadas
            filter.status = "Aprobado";
        }

        // 3. Filtros Dinámicos de Categoría y Ubicación
        if (category) filter.category = category; 
        if (location) filter.location = location;

        const tools = await Tool.find(filter)
            .sort({ createdAt: -1 })
            .populate("category", "name")
            .populate("location", "name")
            .populate("createdBy", "name email");

        // --- ESTADÍSTICAS ---
        let statistics = {};
        if (req.user) {
            // Las estadísticas deben basarse en el contexto (Admin ve todo, Usuario ve lo suyo)
            const statsFilter = req.user.role === "admin" ? {} : { createdBy: req.user._id };
            statistics = {
                totalTools: await Tool.countDocuments(statsFilter),
                aprovedTools: await Tool.countDocuments({ ...statsFilter, status: "Aprobado" }),
                pendingTools: await Tool.countDocuments({ ...statsFilter, status: "Pendiente" }),
                processTools: await Tool.countDocuments({ ...statsFilter, status: "Proceso" }),
                rejectedTools: await Tool.countDocuments({ ...statsFilter, status: "Rechazado" }),
            };
        }

        res.json({ tools, statistics });
    } catch (error) {
        res.status(500).json({ message: "Error al filtrar herramientas", error: error.message });
    }
};

const getToolById = async (req, res) => {
    try {
        const tool = await Tool.findById(req.params.id)
            .populate("createdBy", "name email isVerified verificationStatus profileImage") 
            .populate("category", "name")
            .populate("location", "name");

        if (!tool) return res.status(404).json({ message: "Herramienta no encontrada" });

        // Convertimos a objeto para agregar información extra de seguridad
        const toolData = tool.toObject();
        
        // Si el dueño no está verificado, mandamos un aviso
        if (!toolData.createdBy.isVerified) {
            toolData.securityWarning = "Este usuario aún no ha verificado su identidad.";
        }

        res.json(toolData);
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

const createTool = async (req, res) => {
    try {
        // BUSCAR AL USUARIO PARA VERIFICAR SU ESTADO
        const user = await User.findById(req.user._id);

        // BLOQUEO POR REPUTACIÓN O ESTADO
        if (user.reputation !== null && user.reputation < 2.0) {
            return res.status(403).json({ message: "Reputación crítica." });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No se recibieron imágenes" });
        }

        const { title, description, category, location, price3, price5, price7 } = req.body;
        const imagePaths = req.files.map(file => file.filename);

        const newTool = new Tool({
            title,
            description,
            price3, price5, price7,
            category: Array.isArray(category) ? category : [category].filter(Boolean),
            location: Array.isArray(location) ? location : [location].filter(Boolean),
            imgs: imagePaths,
            createdBy: req.user._id,
            status: "Pendiente"
        });

        await newTool.save();
        res.status(201).json(newTool);
    } catch (error) {
        res.status(500).json({ message: "Error al crear herramienta", error: error.message });
    }
};

const updateTool = async (req, res) => {
    const { id } = req.params;
    try {
        const tool = await Tool.findById(id);
        if (!tool) return res.status(404).json({ message: "No encontrada" });

        if (tool.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "No autorizado: Solo el propietario puede editar" });
        }

        const updateData = {
            title: req.body.title,
            description: req.body.description,
            price3: Number(req.body.price3), 
            price5: Number(req.body.price5),
            price7: Number(req.body.price7),
            productLink: req.body.productLink,
            category: Array.isArray(req.body.category) ? req.body.category : [req.body.category].filter(Boolean),
            location: Array.isArray(req.body.location) ? req.body.location : [req.body.location].filter(Boolean),
        };

        if (req.files && req.files.length > 0) {
            updateData.imgs = req.files.map(file => file.filename);
        }

        if (tool.status === "Rechazado") {
            updateData.status = "Pendiente";
            updateData.adminComments = "";
        }

        const updatedTool = await Tool.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).populate("category location", "name");

        res.status(200).json(updatedTool);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar", error: error.message });
    }
};

const deleteTool = async (req, res) => {
    try {
        const tool = await Tool.findById(req.params.id);
        if (!tool) return res.status(404).json({ message: "No encontrada" });

        // CAMBIO: Solo el propietario puede borrar
        if (tool.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "No autorizado" });
        }

        await tool.deleteOne();
        res.json({ message: "Herramienta eliminada" });

    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

const updateToolStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const tool = await Tool.findById(id);
        if (!tool) return res.status(404).json({ message: "No encontrada" });
        if (req.user.role !== "admin") return res.status(403).json({ message: "No autorizado" });

        tool.status = status;
        if (adminNotes) {
            tool.adminComments = adminNotes;
        }

        // Eliminamos las referencias a 'progress' y 'reviewChecklist' 
        // ya que las quitamos del modelo anteriormente.
        
        await tool.save();
        res.json({ message: "Estado actualizado", tool });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const totalTools = await Tool.countDocuments();
        const pendingTools = await Tool.countDocuments({ status: "Pendiente"});
        const processTools = await Tool.countDocuments({ status: "Proceso"});
        const aprovedTools = await Tool.countDocuments({ status: "Aprobado"});
        const rejectedTools = await Tool.countDocuments({ status: "Rechazado"});

        const userStatuses = ["Pendiente", "Aprobado", "Rechazado"];
        const userDistributionRaw = await User.aggregate([
            {
                $group: {
                    _id: "$verificationStatus",
                    count: { $sum: 1 },
                },
            },
        ]);

        const userDistribution = userStatuses.reduce((acc, status) => {
            acc[status] = userDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});

        userDistribution["Registrados"] = await User.countDocuments({ role: 'member' });

        const recentTools = await Tool.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .select("title status createdAt");

        const toolStatuses = ["Pendiente", "Proceso", "Aprobado", "Rechazado"];
        const toolDistributionRaw = await Tool.aggregate([
            {
                $group: {
                _id: "$status",
                count: { $sum: 1 },
                },
            },
        ]);

        const toolDistribution = toolStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, " ");
            acc[formattedKey] =
            toolDistributionRaw.find((item) => item._id === status)?.count || 0;
            return acc;
        }, {});
        
        toolDistribution["All"] = totalTools;

        res.status(200).json({
            statistics: {
                totalTools,
                pendingTools,
                processTools,
                aprovedTools,
                rejectedTools,
                totalUsers: userDistribution["Registrados"]
            },
            charts: {
                toolDistribution,
                userDistribution
            },
            recentTools
        });
    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. IMPORTANTE: Usamos 'createdBy' porque así lo guardas en createTool
        const total = await Tool.countDocuments({ createdBy: userId });
        const aprobadas = await Tool.countDocuments({ createdBy: userId, status: "Aprobado" }); 
        const pendientes = await Tool.countDocuments({ createdBy: userId, status: "Pendiente" });
        const rechazadas = await Tool.countDocuments({ createdBy: userId, status: "Rechazado" });
        const enProceso = await Tool.countDocuments({ createdBy: userId, status: "Proceso" });

        const recentTools = await Tool.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5);
        const user = await User.findById(userId);

        res.json({
            balance: user.balance || 0,
            toCredit: user.toCredit || 0,
            stadistics: { // Estas son para las Mini Stats
                totalTools: total,
                aprovedTools: aprobadas,
                pendingTools: pendientes,
                rejectedTools: rechazadas,
                processTools: enProceso
            },
            charts: { // Estas son para el PieChart
                toolDistribution: {
                    totalTools: total,
                    pendingTools: pendientes,
                    aprovedTools: aprobadas,
                    rejectedTools: rechazadas,
                    processTools: enProceso
                }
            },
            recentTools
        });
    } catch (error) {
        console.error("Error en dashboard:", error);
        res.status(500).json({ message: "Error interno" });
    }
};

module.exports = { getTools, getToolById, createTool, updateTool, deleteTool, updateToolStatus, getDashboardData, getUserDashboardData };