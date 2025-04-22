const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token não fornecido'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validar entrada
        if (!email || !senha) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // Buscar usuário
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Verificar senha
        const senhaCorreta = await usuario.verificarSenha(senha);
        if (!senhaCorreta) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Atualizar último acesso
        usuario.ultimoAcesso = new Date();
        await usuario.save();

        // Gerar token
        const token = jwt.sign(
            { id: usuario._id, cargo: usuario.cargo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            usuario: usuario.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao realizar login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Registro (apenas para administradores)
router.post('/registro', verificarToken, async (req, res) => {
    try {
        // Verificar se o usuário é admin
        if (req.usuario.cargo !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Apenas administradores podem registrar novos usuários'
            });
        }

        const { nome, email, senha, cargo } = req.body;

        // Validar entrada
        if (!nome || !email || !senha || !cargo) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Verificar se usuário já existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        // Criar novo usuário
        const novoUsuario = new Usuario({
            nome,
            email,
            senha,
            cargo
        });

        await novoUsuario.save();

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            usuario: novoUsuario.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar usuário',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verificar token
router.get('/verificar', verificarToken, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.json({
            success: true,
            usuario: usuario.toJSON()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
