const mongoose = require('mongoose');

const transacaoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['receita', 'despesa'],
        required: [true, 'Tipo de transação é obrigatório']
    },
    categoria: {
        type: String,
        required: [true, 'Categoria é obrigatória'],
        enum: [
            // Receitas
            'venda', 'servico', 'investimento', 'outras_receitas',
            // Despesas
            'fornecedor', 'funcionario', 'aluguel', 'energia',
            'agua', 'internet', 'telefone', 'marketing',
            'manutencao', 'impostos', 'outras_despesas'
        ]
    },
    descricao: {
        type: String,
        required: [true, 'Descrição é obrigatória'],
        trim: true
    },
    valor: {
        type: Number,
        required: [true, 'Valor é obrigatório'],
        min: [0, 'Valor não pode ser negativo']
    },
    dataVencimento: {
        type: Date,
        required: [true, 'Data de vencimento é obrigatória']
    },
    dataPagamento: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pendente', 'pago', 'atrasado', 'cancelado'],
        default: 'pendente'
    },
    formaPagamento: {
        type: String,
        enum: ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'boleto', 'transferencia'],
        required: [true, 'Forma de pagamento é obrigatória']
    },
    comprovante: {
        nome: String,
        url: String,
        tipo: String
    },
    parcelas: {
        total: {
            type: Number,
            default: 1,
            min: [1, 'Número de parcelas deve ser maior que zero']
        },
        atual: {
            type: Number,
            default: 1
        }
    },
    recorrente: {
        type: Boolean,
        default: false
    },
    periodicidade: {
        type: String,
        enum: ['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'],
        default: 'mensal'
    },
    venda: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venda'
    },
    responsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    observacoes: String,
    metadata: {
        numeroPedido: String,
        numeroNota: String,
        codigoBarras: String
    }
}, {
    timestamps: true
});

// Middleware para atualizar status baseado na data
transacaoSchema.pre('save', function(next) {
    const hoje = new Date();
    if (!this.dataPagamento && this.dataVencimento < hoje) {
        this.status = 'atrasado';
    }
    next();
});

// Método para registrar pagamento
transacaoSchema.methods.registrarPagamento = async function(dataPagamento = new Date()) {
    this.dataPagamento = dataPagamento;
    this.status = 'pago';
    return this.save();
};

// Método para gerar próxima parcela
transacaoSchema.methods.gerarProximaParcela = async function() {
    if (!this.recorrente || this.status !== 'pago') return null;

    const novaData = new Date(this.dataVencimento);
    switch (this.periodicidade) {
        case 'mensal':
            novaData.setMonth(novaData.getMonth() + 1);
            break;
        case 'bimestral':
            novaData.setMonth(novaData.getMonth() + 2);
            break;
        case 'trimestral':
            novaData.setMonth(novaData.getMonth() + 3);
            break;
        case 'semestral':
            novaData.setMonth(novaData.getMonth() + 6);
            break;
        case 'anual':
            novaData.setFullYear(novaData.getFullYear() + 1);
            break;
    }

    const novaTransacao = new this.constructor({
        ...this.toObject(),
        dataVencimento: novaData,
        dataPagamento: null,
        status: 'pendente',
        comprovante: null,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return novaTransacao.save();
};

// Método estático para calcular balanço
transacaoSchema.statics.calcularBalanco = async function(filtros = {}) {
    const resultado = await this.aggregate([
        { $match: { ...filtros, status: 'pago' } },
        {
            $group: {
                _id: null,
                receitas: {
                    $sum: {
                        $cond: [{ $eq: ['$tipo', 'receita'] }, '$valor', 0]
                    }
                },
                despesas: {
                    $sum: {
                        $cond: [{ $eq: ['$tipo', 'despesa'] }, '$valor', 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                receitas: 1,
                despesas: 1,
                saldo: { $subtract: ['$receitas', '$despesas'] }
            }
        }
    ]);

    return resultado[0] || { receitas: 0, despesas: 0, saldo: 0 };
};

module.exports = mongoose.model('Transacao', transacaoSchema);
