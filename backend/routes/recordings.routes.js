const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/recordings');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Upload a new recording
router.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }
    res.json({ success: true, message: 'Arquivo enviado com sucesso.', filename: req.file.filename });
});

// List all recordings
router.get('/', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao listar arquivos.' });
        }
        const recordings = files.map(file => ({
            filename: file,
            url: `/uploads/recordings/${file}`
        }));
        res.json({ success: true, recordings });
    });
});

// Delete a recording
router.delete('/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao deletar arquivo.' });
        }
        res.json({ success: true, message: 'Arquivo deletado com sucesso.' });
    });
});

module.exports = router;
