# Backend USE SISTEMAS

Backend do sistema ERP da USE SISTEMAS, desenvolvido com Node.js, Express e MongoDB.

## Estrutura do Projeto

```
backend/
├── docs/           # Documentação
│   ├── api.md     # Documentação da API
│   └── USE_SISTEMAS.postman_collection.json  # Coleção Postman
├── models/         # Modelos do MongoDB
│   ├── Usuario.js  # Modelo de usuário
│   ├── Cliente.js  # Modelo de cliente
│   ├── Produto.js  # Modelo de produto
│   ├── Venda.js    # Modelo de venda
│   └── Financeiro.js # Modelo de transação financeira
├── routes/         # Rotas da API
│   ├── auth.routes.js      # Rotas de autenticação
│   ├── clientes.routes.js  # Rotas de clientes
│   ├── estoque.routes.js   # Rotas de estoque
│   ├── vendas.routes.js    # Rotas de vendas
│   └── financeiro.routes.js # Rotas financeiras
├── scripts/        # Scripts utilitários
│   └── init-admin.js     # Script para criar admin inicial
├── .env            # Variáveis de ambiente
├── .gitignore      # Arquivos ignorados pelo Git
├── package.json    # Dependências e scripts
└── server.js       # Ponto de entrada da aplicação
```

## Requisitos

- Node.js 14+
- MongoDB 4.4+
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Implantac/Novo_ERP.git
cd Novo_ERP/backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Crie o usuário administrador inicial:
```bash
npm run init-admin
```

## Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

## Testando a API

### Documentação
A documentação completa da API está disponível em `/docs/api.md`.

### Postman
1. Importe a coleção do Postman disponível em `/docs/USE_SISTEMAS.postman_collection.json`
2. Configure a variável de ambiente `baseUrl` para `http://localhost:5000/api`
3. Faça login usando o endpoint `/auth/login` para obter o token
4. O token será automaticamente usado nas demais requisições

### Endpoints Principais

- **Autenticação**
  - POST /api/auth/login
  - POST /api/auth/registro

- **Clientes**
  - GET /api/clientes
  - POST /api/clientes
  - GET /api/clientes/:id
  - PUT /api/clientes/:id

- **Estoque**
  - GET /api/estoque
  - POST /api/estoque
  - GET /api/estoque/:id
  - PUT /api/estoque/:id

- **Vendas**
  - GET /api/vendas
  - POST /api/vendas
  - GET /api/vendas/:id
  - PATCH /api/vendas/:id/status

- **Financeiro**
  - GET /api/financeiro
  - POST /api/financeiro
  - GET /api/financeiro/:id
  - POST /api/financeiro/:id/pagamento

## Segurança

- Autenticação via JWT
- Senhas criptografadas com bcrypt
- Validação de dados
- Controle de acesso baseado em cargos

## Cargos de Usuário

- admin: Acesso total ao sistema
- gerente: Acesso a gestão e relatórios
- vendedor: Acesso a vendas e consultas
- estoquista: Acesso ao controle de estoque

## Desenvolvimento

### Instalando novas dependências
```bash
npm install nome-do-pacote
```

### Executando testes
```bash
npm test
```

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença ISC.
