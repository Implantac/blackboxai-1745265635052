const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'Código do produto é obrigatório'],
        unique: true,
        trim: true
    },
    nome: {
        type: String,
        required: [true, 'Nome do produto é obrigatório'],
        trim: true
    },
    descricao: {
        type: String,
        trim: true
    },
    categoria: {
        type: String,
        required: [true, 'Categoria é obrigatória'],
        trim: true
    },
    precoCompra: {
        type: Number,
        required: [true, 'Preço de compra é obrigatório'],
        min: [0, 'Preço de compra não pode ser negativo']
    },
    precoVenda: {
        type: Number,
        required: [true, 'Preço de venda é obrigatório'],
        min: [0, 'Preço de venda não pode ser negativo']
    },
    estoque: {
        quantidade: {
            type: Number,
            default: 0,
            min: [0, 'Quantidade em estoque não pode ser negativa']
        },
        minimo: {
            type: Number,
            required: [true, 'Estoque mínimo é obrigatório'],
            min: [0, 'Estoque mínimo não pode ser negativo']
        },
        maximo: {
            type: Number,
            required: [true, 'Estoque máximo é obrigatório'],
            min: [0, 'Estoque máximo não pode ser negativo']
        }
    },
    unidade: {
        type: String,
        required: [true, 'Unidade de medida é obrigatória'],
        enum: ['un', 'kg', 'l', 'm', 'm2', 'm3', 'cx', 'pct']
    },
    fornecedor: {
        nome: {
            type: String,
            required: [true, 'Nome do fornecedor é obrigatório']
        },
        cnpj: {
            type: String,
            required: [true, 'CNPJ do fornecedor é obrigatório']
        },
        contato: {
            type: String
        }
    },
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'em_falta'],
        default: 'ativo'
    },
    movimentacoes: [{
        tipo: {
            type: String,
            enum: ['entrada', 'saida'],
            required: true
        },
        quantidade: {
            type: Number,
            required: true
        },
        data: {
            type: Date,
            default: Date.now
        },
        responsavel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        observacao: String
    }],
    ultimaAtualizacao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware para atualizar status baseado no estoque
produtoSchema.pre('save', function(next) {
    if (this.isModified('estoque.quantidade')) {
        if (this.estoque.quantidade === 0) {
            this.status = 'em_falta';
        } else if (this.estoque.quantidade < this.estoque.minimo) {
            // Poderia disparar uma notificação aqui
            this.status = 'ativo';
        } else {
            this.status = 'ativo';
        }
        this.ultimaAtualizacao = new Date();
    }
    next();
});

// Método para adicionar movimentação
produtoSchema.methods.adicionarMovimentacao = async function(tipo, quantidade, responsavel, observacao = '') {
    if (tipo === 'entrada') {
        this.estoque.quantidade += quantidade;
    } else if (tipo === 'saida') {
        if (this.estoque.quantidade < quantidade) {
            throw new Error('Quantidade insuficiente em estoque');
        }
        this.estoque.quantidade -= quantidade;
    }

    this.movimentacoes.push({
        tipo,
        quantidade,
        responsavel,
        observacao
    });

    return this.save();
};

// Método para calcular valor total em estoque
produtoSchema.methods.calcularValorTotal = function() {
    return this.estoque.quantidade * this.precoCompra;
};

module.exports = mongoose.model('Produto', produtoSchema);
