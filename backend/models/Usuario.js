const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        trim: true,
        lowercase: true
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'A senha deve ter no mínimo 6 caracteres']
    },
    cargo: {
        type: String,
        required: [true, 'Cargo é obrigatório'],
        enum: ['admin', 'gerente', 'vendedor', 'estoquista']
    },
    ativo: {
        type: Boolean,
        default: true
    },
    ultimoAcesso: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Criptografar senha antes de salvar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.senha = await bcrypt.hash(this.senha, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar senha
usuarioSchema.methods.verificarSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

// Método para retornar usuário sem senha
usuarioSchema.methods.toJSON = function() {
    const usuario = this.toObject();
    delete usuario.senha;
    return usuario;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
