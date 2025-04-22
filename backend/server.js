const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Configuração do ambiente
dotenv.config();

// Inicialização do app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração básica das rotas
app.get('/', (req, res) => {
    res.json({ message: 'API da USE SISTEMAS funcionando!' });
});

// Rotas principais
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/estoque', require('./routes/estoque.routes'));
app.use('/api/vendas', require('./routes/vendas.routes'));
app.use('/api/financeiro', require('./routes/financeiro.routes'));

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

// Conexão com o banco de dados e inicialização do servidor
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Conectado ao MongoDB');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1);
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
