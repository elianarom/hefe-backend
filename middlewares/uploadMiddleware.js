// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no soportado. Use JPEG, PNG o JPG.'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { 
        fileSize: 1024 * 1024 * 5 // 5MB
    } 
});

module.exports = upload;