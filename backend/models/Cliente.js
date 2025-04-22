const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['fisica', 'juridica'],
        required: [true, 'Tipo de cliente é obrigatório']
    },
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    nomeFantasia: {
        type: String,
        trim: true
    },
    documento: {
        tipo: {
            type: String,
            enum: ['cpf', 'cnpj'],
            required: [true, 'Tipo de documento é obrigatório']
        },
        numero: {
            type: String,
            required: [true, 'Número do documento é obrigatório'],
            unique: true,
            trim: true
        }
    },
    inscricaoEstadual: {
        type: String,
        trim: true
    },
    contato: {
        email: {
            type: String,
            required: [true, 'Email é obrigatório'],
            trim: true,
            lowercase: true
        },
        telefone: {
            type: String,
            required: [true, 'Telefone é obrigatório'],
            trim: true
        },
        celular: {
            type: String,
            trim: true
        },
        whatsapp: {
            type: Boolean,
            default: false
        }
    },
    endereco: {
        cep: {
            type: String,
            required: [true, 'CEP é obrigatório'],
            trim: true
        },
        logradouro: {
            type: String,
            required: [true, 'Logradouro é obrigatório'],
            trim: true
        },
        numero: {
            type: String,
            required: [true, 'Número é obrigatório'],
            trim: true
        },
        complemento: {
            type: String,
            trim: true
        },
        bairro: {
            type: String,
            required: [true, 'Bairro é obrigatório'],
            trim: true
        },
        cidade: {
            type: String,
            required: [true, 'Cidade é obrigatória'],
            trim: true
        },
        estado: {
            type: String,
            required: [true, 'Estado é obrigatório'],
            trim: true,
            uppercase: true,
            minlength: 2,
            maxlength: 2
        }
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'bloqueado'],
        default: 'ativo'
    },
    limiteCredito: {
        valor: {
            type: Number,
            default: 0
        },
        utilizado: {
            type: Number,
            default: 0
        },
        disponivel: {
            type: Number,
            default: 0
        }
    },
    condicoesPagamento: {
        prazoPadrao: {
            type: Number,
            default: 30
        },
        formaPagamentoPadrao: {
            type: String,
            enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto'],
            default: 'boleto'
        }
    },
    metadata: {
        ultimaCompra: Date,
        totalCompras: {
            type: Number,
            default: 0
        },
        valorTotalCompras: {
            type: Number,
            default: 0
        },
        ticketMedio: {
            type: Number,
            default: 0
        }
    },
    observacoes: String
}, {
    timestamps: true
});

// Middleware para atualizar limite disponível
clienteSchema.pre('save', function(next) {
    if (this.isModified('limiteCredito.valor') || this.isModified('limiteCredito.utilizado')) {
        this.limiteCredito.disponivel = this.limiteCredito.valor - this.limiteCredito.utilizado;
    }
    next();
});

// Método para verificar limite de crédito
clienteSchema.methods.verificarLimiteCredito = function(valorCompra) {
    return this.limiteCredito.disponivel >= valorCompra;
};

// Método para atualizar métricas após uma compra
clienteSchema.methods.registrarCompra = async function(valor) {
    this.metadata.ultimaCompra = new Date();
    this.metadata.totalCompras += 1;
    this.metadata.valorTotalCompras += valor;
    this.metadata.ticketMedio = this.metadata.valorTotalCompras / this.metadata.totalCompras;
    
    // Atualizar limite utilizado
    this.limiteCredito.utilizado += valor;
    this.limiteCredito.disponivel = this.limiteCredito.valor - this.limiteCredito.utilizado;

    return this.save();
};

// Método para liberar limite de crédito após pagamento
clienteSchema.methods.liberarCredito = async function(valor) {
    this.limiteCredito.utilizado = Math.max(0, this.limiteCredito.utilizado - valor);
    this.limiteCredito.disponivel = this.limiteCredito.valor - this.limiteCredito.utilizado;
    
    return this.save();
};

// Índices
clienteSchema.index({ 'documento.numero': 1 });
clienteSchema.index({ nome: 1 });
clienteSchema.index({ status: 1 });
clienteSchema.index({ 'metadata.ultimaCompra': -1 });

module.exports = mongoose.model('Cliente', clienteSchema);
