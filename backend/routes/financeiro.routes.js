const express = require('express');
const router = express.Router();
const Transacao = require('../models/Financeiro');
const jwt = require('jsonwebtoken');

// Middleware de autenticação
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Por favor, faça login'
        });
    }
};

// Middleware de autorização para finanças
const autorizacaoFinanceiro = (req, res, next) => {
    if (!['admin', 'gerente'].includes(req.usuario.cargo)) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Permissão insuficiente.'
        });
    }
    next();
};

// Listar todas as transações
router.get('/', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const {
            tipo,
            categoria,
            status,
            dataInicio,
            dataFim,
            recorrente
        } = req.query;

        let query = {};

        // Filtros
        if (tipo) query.tipo = tipo;
        if (categoria) query.categoria = categoria;
        if (status) query.status = status;
        if (recorrente !== undefined) query.recorrente = recorrente === 'true';
        if (dataInicio || dataFim) {
            query.dataVencimento = {};
            if (dataInicio) query.dataVencimento.$gte = new Date(dataInicio);
            if (dataFim) query.dataVencimento.$lte = new Date(dataFim);
        }

        const transacoes = await Transacao.find(query)
            .populate('responsavel', 'nome')
            .populate('venda', 'numeroVenda')
            .sort({ dataVencimento: 1 });

        res.json({
            success: true,
            transacoes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar transações',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obter transação específica
router.get('/:id', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const transacao = await Transacao.findById(req.params.id)
            .populate('responsavel', 'nome')
            .populate('venda', 'numeroVenda');

        if (!transacao) {
            return res.status(404).json({
                success: false,
                message: 'Transação não encontrada'
            });
        }

        res.json({
            success: true,
            transacao
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar transação',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Criar nova transação
router.post('/', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const transacao = new Transacao({
            ...req.body,
            responsavel: req.usuario.id
        });

        await transacao.save();

        res.status(201).json({
            success: true,
            message: 'Transação registrada com sucesso',
            transacao
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar transação',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Registrar pagamento
router.post('/:id/pagamento', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const transacao = await Transacao.findById(req.params.id);

        if (!transacao) {
            return res.status(404).json({
                success: false,
                message: 'Transação não encontrada'
            });
        }

        const { dataPagamento } = req.body;
        await transacao.registrarPagamento(dataPagamento);

        // Se for recorrente, gerar próxima parcela
        if (transacao.recorrente) {
            await transacao.gerarProximaParcela();
        }

        res.json({
            success: true,
            message: 'Pagamento registrado com sucesso',
            transacao
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar pagamento',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Cancelar transação
router.patch('/:id/cancelar', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const transacao = await Transacao.findById(req.params.id);

        if (!transacao) {
            return res.status(404).json({
                success: false,
                message: 'Transação não encontrada'
            });
        }

        if (transacao.status === 'pago') {
            return res.status(400).json({
                success: false,
                message: 'Não é possível cancelar uma transação já paga'
            });
        }

        transacao.status = 'cancelado';
        await transacao.save();

        res.json({
            success: true,
            message: 'Transação cancelada com sucesso',
            transacao
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cancelar transação',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Relatório financeiro
router.get('/relatorios/balanco', auth, autorizacaoFinanceiro, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        let filtros = {};

        if (dataInicio || dataFim) {
            filtros.dataPagamento = {};
            if (dataInicio) filtros.dataPagamento.$gte = new Date(dataInicio);
            if (dataFim) filtros.dataPagamento.$lte = new Date(dataFim);
        }

        const balanco = await Transacao.calcularBalanco(filtros);

        // Detalhamento por categoria
        const detalhamento = await Transacao.aggregate([
            { $match: { ...filtros, status: 'pago' } },
            {
                $group: {
                    _id: {
                        tipo: '$tipo',
                        categoria: '$categoria'
                    },
                    total: { $sum: '$valor' },
                    quantidade: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.tipo',
                    categorias: {
                        $push: {
                            categoria: '$_id.categoria',
                            total: '$total',
                            quantidade: '$quantidade'
                        }
                    },
                    total: { $sum: '$total' }
                }
            }
        ]);

        res.json({
            success: true,
            balanco,
            detalhamento
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar relatório',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
