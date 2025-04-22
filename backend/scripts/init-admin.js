const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('../models/Usuario');

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env' });

// Dados do administrador inicial
const adminData = {
    nome: 'Administrador',
    email: 'admin@usesistemas.com.br',
    senha: 'admin123456',
    cargo: 'admin',
    ativo: true
};

// Função para criar o administrador
async function criarAdmin() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/use_sistemas');
        console.log('Conectado ao MongoDB');

        // Verificar se já existe um admin
        const adminExistente = await Usuario.findOne({ cargo: 'admin' });
        
        if (adminExistente) {
            console.log('Administrador já existe no sistema');
            process.exit(0);
        }

        // Criar novo admin
        const admin = new Usuario(adminData);
        await admin.save();

        console.log('Administrador criado com sucesso:');
        console.log('Email:', adminData.email);
        console.log('Senha:', adminData.senha);
        console.log('\nPor favor, altere a senha após o primeiro login!');

    } catch (error) {
        console.error('Erro ao criar administrador:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Executar a função
criarAdmin();
