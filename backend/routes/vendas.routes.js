const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
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

// Middleware de autorização para vendas
const autorizacaoVendas = (req, res, next) => {
    if (!['admin', 'gerente', 'vendedor'].includes(req.usuario.cargo)) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Permissão insuficiente.'
        });
    }
    next();
};

// Listar todas as vendas
router.get('/', auth, async (req, res) => {
    try {
        const { status, dataInicio, dataFim, vendedor } = req.query;
        let query = {};

        // Filtros
        if (status) query.status = status;
        if (vendedor) query.vendedor = vendedor;
        if (dataInicio || dataFim) {
            query.createdAt = {};
            if (dataInicio) query.createdAt.$gte = new Date(dataInicio);
            if (dataFim) query.createdAt.$lte = new Date(dataFim);
        }

        // Restrição por cargo
        if (req.usuario.cargo === 'vendedor') {
            query.vendedor = req.usuario.id;
        }

        const vendas = await Venda.find(query)
            .populate('vendedor', 'nome')
            .populate('itens.produto', 'nome codigo')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            vendas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar vendas',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obter venda específica
router.get('/:id', auth, async (req, res) => {
    try {
        const venda = await Venda.findById(req.params.id)
            .populate('vendedor', 'nome')
            .populate('itens.produto', 'nome codigo precoVenda');

        if (!venda) {
            return res.status(404).json({
                success: false,
                message: 'Venda não encontrada'
            });
        }

        // Verificar permissão
        if (req.usuario.cargo === 'vendedor' && venda.vendedor._id.toString() !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Você só pode ver suas próprias vendas.'
            });
        }

        res.json({
            success: true,
            venda
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar venda',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Criar nova venda
router.post('/', auth, autorizacaoVendas, async (req, res) => {
    try {
        const venda = new Venda({
            ...req.body,
            vendedor: req.usuario.id
        });

        // Verificar estoque
        await venda.verificarEstoque();

        // Calcular totais
        venda.calcularTotais();

        // Salvar venda
        await venda.save();

        // Baixar estoque
        if (venda.status === 'aprovada') {
            await venda.baixarEstoque();
        }

        res.status(201).json({
            success: true,
            message: 'Venda registrada com sucesso',
            venda
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar venda',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Atualizar status da venda
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const venda = await Venda.findById(req.params.id);

        if (!venda) {
            return res.status(404).json({
                success: false,
                message: 'Venda não encontrada'
            });
        }

        // Verificar permissão
        if (req.usuario.cargo === 'vendedor') {
            if (venda.vendedor.toString() !== req.usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Você só pode atualizar suas próprias vendas.'
                });
            }
            // Vendedor só pode cancelar vendas pendentes
            if (status === 'cancelada' && venda.status !== 'pendente') {
                return res.status(403).json({
                    success: false,
                    message: 'Você só pode cancelar vendas pendentes.'
                });
            }
        }

        // Atualizar status
        venda.status = status;

        // Se aprovada, baixar estoque
        if (status === 'aprovada' && venda.status !== 'aprovada') {
            await venda.verificarEstoque();
            await venda.baixarEstoque();
        }

        await venda.save();

        res.json({
            success: true,
            message: 'Status da venda atualizado com sucesso',
            venda
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status da venda',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Relatório de vendas
router.get('/relatorios/vendas', auth, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        let query = {};

        // Filtro de data
        if (dataInicio || dataFim) {
            query.createdAt = {};
            if (dataInicio) query.createdAt.$gte = new Date(dataInicio);
            if (dataFim) query.createdAt.$lte = new Date(dataFim);
        }

        // Restrição por cargo
        if (req.usuario.cargo === 'vendedor') {
            query.vendedor = req.usuario.id;
        }

        // Agregação
        const relatorio = await Venda.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        ano: { $year: "$createdAt" },
                        mes: { $month: "$createdAt" }
                    },
                    totalVendas: { $sum: 1 },
                    valorTotal: { $sum: "$pagamento.valorTotal" },
                    vendasAprovadas: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "aprovada"] }, 1, 0]
                        }
                    },
                    vendasCanceladas: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "cancelada"] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { "_id.ano": -1, "_id.mes": -1 } }
        ]);

        res.json({
            success: true,
            relatorio
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
