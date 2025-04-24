const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configuração do ambiente
dotenv.config();

// Inicialização do app
const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../')));

// Configuração básica das rotas e API
app.get('/api', (req, res) => {
    res.json({ message: 'API da USE SISTEMAS funcionando!' });
});

// Rotas principais
app.get('/api', (req, res) => {
    res.json({ 
        message: 'API da USE SISTEMAS funcionando!',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// Importa rota de gravações
const recordingsRoutes = require('./routes/recordings.routes');
app.use('/api/recordings', recordingsRoutes);

// Rota para todas as requisições não-API para suportar HTML5 History mode
app.get('*', (req, res, next) => {
    // Se a requisição começar com /api, passa para o próximo middleware
    if (req.path.startsWith('/api')) {
        return next();
    }
    // Caso contrário, envia o index.html
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Erros de validação do Mongoose
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Erro de validação',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Erros de ID inválido do Mongoose
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            message: 'ID inválido'
        });
    }

    // Erros de duplicação (unique: true)
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Registro duplicado',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    // Erro padrão
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Inicialização do servidor
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} no navegador`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('Erro não tratado:', err);
    // Em produção, você pode querer notificar um serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
        // Implementar notificação para equipe de desenvolvimento
    }
});

process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM. Encerrando graciosamente...');
    mongoose.connection.close()
        .then(() => {
            console.log('MongoDB desconectado');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Erro ao desconectar MongoDB:', err);
            process.exit(1);
        });
});
