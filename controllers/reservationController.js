const Reservation = require("../models/Reservation");
const Tool = require("../models/Tool");

const createReservation = async (req, res) => {
    try {
        const { toolId, startDate, daysSelected } = req.body;
        const tool = await Tool.findById(toolId);
        
        if (!tool) return res.status(404).json({ message: "Herramienta no encontrada" });

        const start = new Date(startDate);
        const end = new Date(startDate);
        end.setDate(start.getDate() + Number(daysSelected));

        const price = tool[`price${daysSelected}`];

        const newReservation = new Reservation({
            tool: toolId,
            renter: req.user._id,
            owner: tool.createdBy,
            startDate: start,
            endDate: end,
            daysSelected,
            totalPrice: price,
            status: "Pendiente"
        });

        await newReservation.save();
        res.status(201).json(newReservation);
    } catch (error) {
        res.status(500).json({ message: "Error al crear", error: error.message });
    }
};

const getUserReservationsData = async (req, res) => {
    try {
        const userId = req.user._id; 

        // 1. Dueño: Alquileres que recibió (Mis Reservas)
        const rentalsReceived = await Reservation.find({ owner: userId })
            .populate('tool')
            .populate('renter', 'name email phone')
            .sort({ createdAt: -1 }); 

        // 2. Inquilino: Herramientas que pidió (Mis Pedidos)
        const myRentals = await Reservation.find({ renter: userId })
            .populate('tool')
            .populate('owner', 'name email phone')
            .sort({ createdAt: -1 }); 

        res.json({ myRentals, rentalsReceived });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener reservas", error: error.message });
    }
};

const updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 

        // 🔥 IMPORTANTE: Validamos contra los nombres exactos del ENUM del modelo
        const validStatuses = ["Pendiente", "Aprobado", "Entregado", "Finalizado", "Cancelado"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        // Bloqueamos el paso a "Finalizado" manual para usar finalizeReservation
        if (status === "Finalizado") {
            return res.status(400).json({ message: "Para finalizar debes completar las reseñas primero." });
        }

        const reservation = await Reservation.findOneAndUpdate(
            { _id: id, owner: req.user._id },
            { status },
            { new: true }
        );

        if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

        res.json({ message: `Estado actualizado a ${status}`, reservation });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado" });
    }
};

const getOwnerBalance = async (req, res) => {
    const reservations = await Reservation.find({ 
        owner: req.user._id, 
        paymentStatus: 'approved',
        moneyReleased: false 
    });

    const totalBalance = reservations.reduce((acc, curr) => acc + curr.totalPrice, 0);
    res.json({ totalBalance, count: reservations.length });
};

const getNotificationCount = async (req, res) => {
    try {
        const count = await Reservation.countDocuments({ 
            owner: req.user._id, 
            status: "Pendiente",
            seen: false // <--- Solo contamos las nuevas
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
};

const markAsSeen = async (req, res) => {
    try {
        // Marcamos como "vistas" las que están en estado Pendiente para este dueño
        await Reservation.updateMany(
            { owner: req.user._id, status: "Pendiente", seen: false },
            { $set: { seen: true } }
        );
        res.json({ message: "Notificaciones marcadas como leídas" });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar" });
    }
};

const submitReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { review } = req.body; 
        const userId = req.user._id;

        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

        if (reservation.owner.toString() === userId.toString()) {
            reservation.ownerReview = review || "Calificado";
        } else if (reservation.renter.toString() === userId.toString()) {
            reservation.renterReview = review || "Calificado";
        } else {
            return res.status(403).json({ message: "No autorizado" });
        }

        await reservation.save();
        res.json({ message: "Flujo de reserva actualizado", reservation });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar flujo de reseña" });
    }
};

const finalizeReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const reservation = await Reservation.findOne({ _id: id, owner: userId }).populate('tool');
        
        if (!reservation) return res.status(404).json({ message: "Reserva no encontrada" });

        if (!reservation.ownerReview || !reservation.renterReview) {
            return res.status(400).json({ 
                message: "Ambas partes deben dejar una reseña antes de liberar el pago." 
            });
        }

        // 1. Actualizar Reserva
        reservation.status = "Finalizado"; // Cambiado a masculino para coincidir con modelo
        reservation.moneyReleased = true;

        // 2. Acreditar dinero (Billetera)
        const owner = await User.findById(userId);
        owner.toCredit = Math.max(0, (owner.toCredit || 0) - reservation.totalPrice);
        owner.balance = (owner.balance || 0) + reservation.totalPrice;

        // 3. Liberar Herramienta
        await Tool.findByIdAndUpdate(reservation.tool._id, { status: "Aprobado" });

        await owner.save();
        await reservation.save();

        res.json({ message: "Dinero acreditado con éxito.", reservation });
    } catch (error) {
        res.status(500).json({ message: "Error al finalizar la reserva" });
    }
};

module.exports = { createReservation, getUserReservationsData, updateReservationStatus, getOwnerBalance, getNotificationCount, markAsSeen, submitReview, finalizeReservation };