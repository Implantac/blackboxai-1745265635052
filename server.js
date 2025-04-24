const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Enable CORS for all routes
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Basic API endpoint for testing
app.get('/api', (req, res) => {
    console.log('API endpoint hit');
    res.json({
        message: 'API funcionando!',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        console.log(`Serving index.html for ${req.url}`);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse o site no navegador usando http://localhost:${PORT}`);
    console.log('Diretório base:', __dirname);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Porta ${PORT} já está em uso. Tentando outra porta...`);
        server.close();
        app.listen(0); // Let the OS assign a random port
    } else {
        console.error('Erro no servidor:', err);
    }
});
