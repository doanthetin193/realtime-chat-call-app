const path = require('path');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Trả về URL của file đã upload
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl: fileUrl,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        
        res.json({
            message: "File uploaded successfully",
            fileUrl: fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed' });
    }
};

module.exports = { uploadImage, uploadFile };
