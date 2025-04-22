const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
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

// Middleware de autorização para clientes
const autorizacaoClientes = (req, res, next) => {
    if (!['admin', 'gerente', 'vendedor'].includes(req.usuario.cargo)) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Permissão insuficiente.'
        });
    }
    next();
};

// Listar todos os clientes
router.get('/', auth, async (req, res) => {
    try {
        const {
            tipo,
            status,
            vendedor,
            busca,
            ordenar,
            limite = 10,
            pagina = 1
        } = req.query;

        let query = {};

        // Filtros
        if (tipo) query.tipo = tipo;
        if (status) query.status = status;
        if (vendedor) query.vendedor = vendedor;
        if (busca) {
            query.$or = [
                { nome: { $regex: busca, $options: 'i' } },
                { 'documento.numero': { $regex: busca, $options: 'i' } },
                { 'contato.email': { $regex: busca, $options: 'i' } }
            ];
        }

        // Restrição por cargo
        if (req.usuario.cargo === 'vendedor') {
            query.vendedor = req.usuario.id;
        }

        // Ordenação
        let sort = { createdAt: -1 };
        if (ordenar) {
            switch (ordenar) {
                case 'nome':
                    sort = { nome: 1 };
                    break;
                case 'ultimaCompra':
                    sort = { 'metadata.ultimaCompra': -1 };
                    break;
                case 'valorTotal':
                    sort = { 'metadata.valorTotalCompras': -1 };
                    break;
            }
        }

        const total = await Cliente.countDocuments(query);
        const clientes = await Cliente.find(query)
            .populate('vendedor', 'nome')
            .sort(sort)
            .skip((pagina - 1) * limite)
            .limit(parseInt(limite));

        res.json({
            success: true,
            clientes,
            paginacao: {
                total,
                paginas: Math.ceil(total / limite),
                atual: pagina,
                porPagina: limite
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar clientes',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obter cliente específico
router.get('/:id', auth, async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id)
            .populate('vendedor', 'nome');

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar permissão
        if (req.usuario.cargo === 'vendedor' && 
            cliente.vendedor && 
            cliente.vendedor._id.toString() !== req.usuario.id) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Este cliente pertence a outro vendedor.'
            });
        }

        res.json({
            success: true,
            cliente
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Cadastrar novo cliente
router.post('/', auth, autorizacaoClientes, async (req, res) => {
    try {
        // Verificar documento duplicado
        const documentoExistente = await Cliente.findOne({
            'documento.numero': req.body.documento.numero
        });

        if (documentoExistente) {
            return res.status(400).json({
                success: false,
                message: 'Documento já cadastrado'
            });
        }

        const cliente = new Cliente({
            ...req.body,
            vendedor: req.usuario.cargo === 'vendedor' ? req.usuario.id : req.body.vendedor
        });

        await cliente.save();

        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            cliente
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Atualizar cliente
router.put('/:id', auth, autorizacaoClientes, async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar permissão
        if (req.usuario.cargo === 'vendedor') {
            if (cliente.vendedor && cliente.vendedor.toString() !== req.usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Este cliente pertence a outro vendedor.'
                });
            }
        }

        // Verificar documento duplicado se estiver sendo alterado
        if (req.body.documento && req.body.documento.numero !== cliente.documento.numero) {
            const documentoExistente = await Cliente.findOne({
                'documento.numero': req.body.documento.numero
            });

            if (documentoExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Documento já cadastrado'
                });
            }
        }

        // Atualizar campos
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== 'metadata') {
                cliente[key] = req.body[key];
            }
        });

        await cliente.save();

        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            cliente
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Atualizar status do cliente
router.patch('/:id/status', auth, autorizacaoClientes, async (req, res) => {
    try {
        const { status } = req.body;
        const cliente = await Cliente.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar permissão
        if (req.usuario.cargo === 'vendedor') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores e gerentes podem alterar o status.'
            });
        }

        cliente.status = status;
        await cliente.save();

        res.json({
            success: true,
            message: 'Status do cliente atualizado com sucesso',
            cliente
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do cliente',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Relatório de clientes
router.get('/relatorios/clientes', auth, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        let matchQuery = {};

        // Filtro de data
        if (dataInicio || dataFim) {
            matchQuery.createdAt = {};
            if (dataInicio) matchQuery.createdAt.$gte = new Date(dataInicio);
            if (dataFim) matchQuery.createdAt.$lte = new Date(dataFim);
        }

        // Restrição por cargo
        if (req.usuario.cargo === 'vendedor') {
            matchQuery.vendedor = req.usuario.id;
        }

        const relatorio = await Cliente.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: {
                        tipo: '$tipo',
                        status: '$status'
                    },
                    total: { $sum: 1 },
                    valorTotalCompras: { $sum: '$metadata.valorTotalCompras' },
                    ticketMedioTotal: { $avg: '$metadata.ticketMedio' }
                }
            },
            {
                $group: {
                    _id: '$_id.tipo',
                    statusBreakdown: {
                        $push: {
                            status: '$_id.status',
                            total: '$total',
                            valorTotalCompras: '$valorTotalCompras',
                            ticketMedioTotal: '$ticketMedioTotal'
                        }
                    },
                    totalClientes: { $sum: '$total' },
                    valorTotalGeral: { $sum: '$valorTotalCompras' }
                }
            }
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
