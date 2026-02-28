const {MercadoPagoConfig, Preference} = require ("mercadopago")
const Reservation = require("../models/Reservation")
const Tool = require("../models/Tool");

// Configura el cliente con tu Access Token de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const createPreference = async (req, res) => {
    try {
        const { title, price, reservationId } = req.body;
        const preference = new Preference(client);

        const body = {
            items: [{
                title: title,
                unit_price: Number(price),
                quantity: 1,
                currency_id: "ARS"
            }],
            payer: { email: req.user.email },
            back_urls: {
                // Cambiado a tu dominio real
                success: "https://hefe.com.ar/usuario/reservas",
                failure: "https://hefe.com.ar/usuario/reservas",
                pending: "https://hefe.com.ar/usuario/reservas",
            },
            auto_return: "approved",
            external_reference: reservationId,
            // --- ESTA ES LA CLAVE PARA EL WEBHOOK ---
            // Usamos la URL de ngrok que pasaste o tu dominio si el backend ya es público
            notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
        };
        
        const result = await preference.create({ body });
        res.json({ id: result.id, init_point: result.init_point });

    } catch (error) {
        res.status(500).json({ message: "Error al crear pago", error: error.message });
    }
};

const receiveWebhook = async (req, res) => {
    try {
        // Mercado Pago envía el ID del pago de dos formas según la versión, 
        // con dataId nos aseguramos de capturarlo.
        const { type } = req.query;
        const dataId = req.query["data.id"] || req.body?.data?.id;

        if (type === "payment" && dataId) {
            console.log(`🔔 Notificación recibida para el pago: ${dataId}`);

            const response = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });
            
            if (!response.ok) {
                throw new Error("Error al consultar el estado del pago en Mercado Pago");
            }

            const data = await response.json();

            // Verificamos si el pago fue aprobado
            if (data.status === "approved") {
                const reservationId = data.external_reference; 
                
                // 1. Actualizar la Reserva con el ID de transacción real de MP
                const updatedReservation = await Reservation.findByIdAndUpdate(
                    reservationId, 
                    { 
                        paymentStatus: "Aprobado", 
                        mercadopagoPaymentId: data.id, // ID de operación de la captura (ej: 147285952692)
                        status: "Aprobado",
                        seen: false // Marcamos como no vista para que salte el puntito rojo al dueño
                    },
                    { new: true }
                );

                // 2. Bloquear la herramienta cambiándola a estado "Proceso"
                if (updatedReservation) {
                    await Tool.findByIdAndUpdate(updatedReservation.tool, {
                        status: "Proceso" 
                    });
                    console.log(`✅ Pago aprobado. Operación: ${data.id}. Reserva: ${reservationId}`);
                }
            } else {
                console.log(`⚠️ El pago ${dataId} tiene estado: ${data.status}`);
            }
        }
        
        // Es vital responder 200 o 204 siempre a Mercado Pago para que no re-envíe la notificación
        res.sendStatus(204);

    } catch (error) {
        console.error("❌ Error en Webhook:", error.message);
        // Respondemos 500 solo si realmente falló algo crítico para que MP reintente luego
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPreference, receiveWebhook };