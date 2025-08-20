const express = require('express');
const upload = require('../config/multer');
const { uploadImage, uploadFile } = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Upload single image
router.post('/image', authMiddleware, upload.single('image'), uploadImage);

// Upload any file
router.post('/', authMiddleware, upload.single('file'), uploadFile);

module.exports = router;
