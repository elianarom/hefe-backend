const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { verificationEmailTemplate, rejectionEmailTemplate } = require("../utils/emailTemplate");

//Generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "5d"});
};

const registerUser = async (req, res) => {
    try {
        // 1. Agregamos username y phone al destructuring
        const { name, username, email, phone, password, profileImage, adminInviteToken } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({message: "El email ya está registrado"});
        }

        // 2. Verificar si el username ya existe (Importante para evitar errores 11000)
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({message: "El nombre de usuario ya está en uso"});
        }

        let role = "member";
        if (adminInviteToken && adminInviteToken == process.env.ADMIN_INVITE_TOKEN) {
            role = "admin";
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Pasar TODOS los campos necesarios al modelo
        const user = await User.create({
            name,
            username, // <--- Faltaba este
            email,
            phone,    // <--- Faltaba este
            password: hashedPassword,
            profileImage,
            role
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username, // Devolverlo para el UserContext
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            token: generateToken(user._id),
        });

    // En authController.js dentro de registerUser
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(", "), errors: error.errors });
        }
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Email y/o contraseña inválido/s" });
        }

        // --- BLOQUEO POR SUSPENSIÓN ---
        if (user.status === "Suspendido") {
            return res.status(403).json({ 
                message: "Tu cuenta ha sido suspendida debido a una baja reputación. Contacta a soporte." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email y/o contraseña inválido/s" });
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status, // Agregado
            reputation: user.reputation, // Agregado
            profileImage: user.profileImage,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        // Extraemos los datos del cuerpo de la petición
        const { name, email, phone, profileImage, password } = req.body;

        // Preparamos el objeto con los campos a actualizar
        const updateData = {};
        
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (profileImage) updateData.profileImage = profileImage;

        // Si el usuario envía una contraseña por este medio, la hasheamos
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Realizamos la actualización usando findByIdAndUpdate
        // Esto evita el error de "username obligatorio" porque solo valida lo que se envía
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { 
                new: true,           // Devuelve el documento actualizado
                runValidators: true, // Valida solo los campos que estamos enviando
                context: 'query' 
            }
        ).select("-password"); // Excluimos la contraseña de la respuesta por seguridad

        if (!updatedUser) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Devolvemos el objeto completo para que el frontend actualice el UserContext
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            profileImage: updatedUser.profileImage,
            isVerified: updatedUser.isVerified,
            verificationStatus: updatedUser.verificationStatus,
            token: generateToken(updatedUser._id), // Generamos un nuevo token con los datos frescos
        });

    } catch (error) {
        console.error("Error en updateUserProfile:", error);
        
        // Manejo específico para errores de validación (ej: email duplicado)
        if (error.code === 11000) {
            return res.status(400).json({ message: "El email ya está en uso por otro usuario" });
        }

        res.status(500).json({ 
            message: "Error al actualizar el perfil", 
            error: error.message 
        });
    }
};

const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body; // "Aprobado" o "Rechazado"

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        user.verificationStatus = status;
        user.isVerified = (status === "Aprobado");
        await user.save({ validateModifiedOnly: true });

        // --- LÓGICA DE NOTIFICACIONES ---
        try {
            if (status === "Rechazado") {
            await sendEmail({
                email: user.email,
                subject: "⚠ Acción requerida en tu cuenta - Hefe",
                html: rejectionEmailTemplate(user.name, reason) // Pasamos el motivo al template
            });
        } else if (status === "Aprobado") {
                await sendEmail({
                    email: user.email,
                    subject: "✓ Cuenta Verificada - Comunidad Hefe",
                    html: verificationEmailTemplate(user.name)
                });
            } else if (status === "Rechazado") {
                await sendEmail({
                    email: user.email,
                    subject: "⚠ Acción requerida en tu cuenta - Hefe",
                    html: rejectionEmailTemplate(user.name)
                });
            }
        } catch (mailError) {
            console.error("Falla en envío de mail, pero el status se actualizó:", mailError);
        }

        res.json({ message: `Usuario ${status} con éxito`, user });
    } catch (error) {
        res.status(500).json({ message: "Error al verificar usuario", error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // 1. Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }

        // 2. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. ACTUALIZACIÓN DIRECTA (Para evitar errores de validación en otros campos)
        await User.findByIdAndUpdate(req.user.id, 
            { $set: { password: hashedPassword } },
            { runValidators: false } // Esto evita que pida el teléfono y username aquí
        );

        res.json({ message: "Contraseña actualizada con éxito" });
    } catch (error) {
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, verifyUser, changePassword };