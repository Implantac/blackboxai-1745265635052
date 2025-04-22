const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
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

// Middleware de autorização para estoque
const autorizacaoEstoque = (req, res, next) => {
    if (!['admin', 'gerente', 'estoquista'].includes(req.usuario.cargo)) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Permissão insuficiente.'
        });
    }
    next();
};

// Listar todos os produtos
router.get('/', auth, async (req, res) => {
    try {
        const { categoria, status, busca } = req.query;
        let query = {};

        if (categoria) query.categoria = categoria;
        if (status) query.status = status;
        if (busca) {
            query.$or = [
                { nome: { $regex: busca, $options: 'i' } },
                { codigo: { $regex: busca, $options: 'i' } }
            ];
        }

        const produtos = await Produto.find(query)
            .sort({ nome: 1 })
            .select('-movimentacoes');

        res.json({
            success: true,
            produtos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar produtos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obter produto específico
router.get('/:id', auth, async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);
        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            produto
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar produto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Cadastrar novo produto
router.post('/', auth, autorizacaoEstoque, async (req, res) => {
    try {
        const produto = new Produto({
            ...req.body,
            ultimaAtualizacao: new Date()
        });

        await produto.save();

        res.status(201).json({
            success: true,
            message: 'Produto cadastrado com sucesso',
            produto
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar produto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Atualizar produto
router.put('/:id', auth, autorizacaoEstoque, async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id);
        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        // Atualizar campos
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== 'movimentacoes') {
                produto[key] = req.body[key];
            }
        });

        produto.ultimaAtualizacao = new Date();
        await produto.save();

        res.json({
            success: true,
            message: 'Produto atualizado com sucesso',
            produto
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar produto',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Registrar movimentação de estoque
router.post('/:id/movimentacao', auth, autorizacaoEstoque, async (req, res) => {
    try {
        const { tipo, quantidade, observacao } = req.body;
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        await produto.adicionarMovimentacao(tipo, quantidade, req.usuario.id, observacao);

        res.json({
            success: true,
            message: 'Movimentação registrada com sucesso',
            produto
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar movimentação',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obter histórico de movimentações
router.get('/:id/movimentacoes', auth, async (req, res) => {
    try {
        const produto = await Produto.findById(req.params.id)
            .populate('movimentacoes.responsavel', 'nome');

        if (!produto) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        res.json({
            success: true,
            movimentacoes: produto.movimentacoes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar movimentações',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Relatório de produtos com estoque baixo
router.get('/relatorios/estoque-baixo', auth, autorizacaoEstoque, async (req, res) => {
    try {
        const produtosBaixoEstoque = await Produto.find({
            'estoque.quantidade': { $lte: '$estoque.minimo' }
        }).select('codigo nome estoque categoria');

        res.json({
            success: true,
            produtos: produtosBaixoEstoque
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
