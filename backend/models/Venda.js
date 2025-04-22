const mongoose = require('mongoose');

const vendaSchema = new mongoose.Schema({
    numeroVenda: {
        type: String,
        required: true,
        unique: true
    },
    cliente: {
        nome: {
            type: String,
            required: [true, 'Nome do cliente é obrigatório']
        },
        documento: {
            tipo: {
                type: String,
                enum: ['cpf', 'cnpj'],
                required: true
            },
            numero: {
                type: String,
                required: true
            }
        },
        email: String,
        telefone: String,
        endereco: {
            rua: String,
            numero: String,
            complemento: String,
            bairro: String,
            cidade: String,
            estado: String,
            cep: String
        }
    },
    itens: [{
        produto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Produto',
            required: true
        },
        quantidade: {
            type: Number,
            required: true,
            min: [1, 'Quantidade deve ser maior que zero']
        },
        precoUnitario: {
            type: Number,
            required: true,
            min: [0, 'Preço não pode ser negativo']
        },
        desconto: {
            type: Number,
            default: 0,
            min: [0, 'Desconto não pode ser negativo']
        },
        total: {
            type: Number,
            required: true
        }
    }],
    pagamento: {
        metodo: {
            type: String,
            enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto'],
            required: true
        },
        status: {
            type: String,
            enum: ['pendente', 'aprovado', 'recusado', 'estornado'],
            default: 'pendente'
        },
        parcelas: {
            type: Number,
            default: 1,
            min: [1, 'Número de parcelas deve ser maior que zero']
        },
        valorTotal: {
            type: Number,
            required: true
        },
        desconto: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: ['pendente', 'aprovada', 'cancelada', 'entregue'],
        default: 'pendente'
    },
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    observacoes: String,
    dataEntrega: Date,
    nfe: {
        numero: String,
        serie: String,
        chaveAcesso: String,
        dataEmissao: Date,
        xml: String,
        pdf: String
    }
}, {
    timestamps: true
});

// Middleware para gerar número da venda
vendaSchema.pre('save', async function(next) {
    if (!this.numeroVenda) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Encontrar última venda do mês
        const ultimaVenda = await this.constructor.findOne({
            numeroVenda: new RegExp(`^${year}${month}`)
        }).sort({ numeroVenda: -1 });

        let numero = '0001';
        if (ultimaVenda) {
            const ultimoNumero = parseInt(ultimaVenda.numeroVenda.slice(-4));
            numero = String(ultimoNumero + 1).padStart(4, '0');
        }

        this.numeroVenda = `${year}${month}${numero}`;
    }
    next();
});

// Método para calcular totais
vendaSchema.methods.calcularTotais = function() {
    // Calcular total dos itens
    const totalItens = this.itens.reduce((total, item) => {
        return total + (item.quantidade * item.precoUnitario - item.desconto);
    }, 0);

    // Aplicar desconto geral
    this.pagamento.valorTotal = totalItens - (this.pagamento.desconto || 0);

    return this.pagamento.valorTotal;
};

// Método para verificar estoque
vendaSchema.methods.verificarEstoque = async function() {
    for (const item of this.itens) {
        const produto = await mongoose.model('Produto').findById(item.produto);
        if (!produto) {
            throw new Error(`Produto ${item.produto} não encontrado`);
        }
        if (produto.estoque.quantidade < item.quantidade) {
            throw new Error(`Estoque insuficiente para o produto ${produto.nome}`);
        }
    }
    return true;
};

// Método para baixar estoque
vendaSchema.methods.baixarEstoque = async function() {
    for (const item of this.itens) {
        const produto = await mongoose.model('Produto').findById(item.produto);
        await produto.adicionarMovimentacao(
            'saida',
            item.quantidade,
            this.vendedor,
            `Venda #${this.numeroVenda}`
        );
    }
};

module.exports = mongoose.model('Venda', vendaSchema);
