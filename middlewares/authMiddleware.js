const jwt = require("jsonwebtoken");
const User = require("../models/User");

//Middleware protect routes
const protect = async (req, res, next) => {
    try {
        let token = req.headers.authorization;

        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            return next(); // <--- IMPORTANTE: Retornar el next
        } else {
            // Este es el mensaje que ves en el navegador
            return res.status(401).json({ message: "No estás autorizado para esta acción" });
        }
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado", error: error.message });
    }
};

const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Reutiliza la lógica de tu middleware 'protect' para verificar el token
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      return next();
    } catch (error) {
      // Si el token es inválido, simplemente seguimos sin usuario
      return next();
    }
  }
  // Si no hay token, seguimos adelante sin req.user
  next();
};

//Middleware Admin-only access
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ message: "Acceso denegado. Solo administradores" });
    }
};


module.exports = { protect, optionalProtect, adminOnly };

