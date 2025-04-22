# Documentação da API - USE SISTEMAS

## Base URL
`http://localhost:5000/api`

## Autenticação
Todas as rotas (exceto login) requerem o header de autenticação:
```
Authorization: Bearer {token}
```

## Endpoints

### Autenticação
- **POST** `/auth/login`
  ```json
  {
    "email": "string",
    "senha": "string"
  }
  ```

- **POST** `/auth/registro` (requer admin)
  ```json
  {
    "nome": "string",
    "email": "string",
    "senha": "string",
    "cargo": "enum(admin, gerente, vendedor, estoquista)"
  }
  ```

### Clientes
- **GET** `/clientes`
  - Query params:
    - tipo: "fisica" | "juridica"
    - status: "ativo" | "inativo" | "bloqueado"
    - busca: string
    - ordenar: "nome" | "ultimaCompra" | "valorTotal"
    - limite: number
    - pagina: number

- **GET** `/clientes/:id`

- **POST** `/clientes`
  ```json
  {
    "tipo": "enum(fisica, juridica)",
    "nome": "string",
    "nomeFantasia": "string",
    "documento": {
      "tipo": "enum(cpf, cnpj)",
      "numero": "string"
    },
    "contato": {
      "email": "string",
      "telefone": "string"
    },
    "endereco": {
      "cep": "string",
      "logradouro": "string",
      "numero": "string",
      "bairro": "string",
      "cidade": "string",
      "estado": "string"
    }
  }
  ```

### Estoque
- **GET** `/estoque`
  - Query params:
    - categoria: string
    - status: "ativo" | "inativo" | "em_falta"
    - busca: string

- **GET** `/estoque/:id`

- **POST** `/estoque`
  ```json
  {
    "codigo": "string",
    "nome": "string",
    "descricao": "string",
    "categoria": "string",
    "precoCompra": "number",
    "precoVenda": "number",
    "estoque": {
      "minimo": "number",
      "maximo": "number"
    },
    "unidade": "enum(un, kg, l, m, m2, m3, cx, pct)",
    "fornecedor": {
      "nome": "string",
      "cnpj": "string"
    }
  }
  ```

### Vendas
- **GET** `/vendas`
  - Query params:
    - status: "pendente" | "aprovada" | "cancelada" | "entregue"
    - dataInicio: date
    - dataFim: date
    - vendedor: string

- **POST** `/vendas`
  ```json
  {
    "cliente": {
      "nome": "string",
      "documento": {
        "tipo": "enum(cpf, cnpj)",
        "numero": "string"
      }
    },
    "itens": [{
      "produto": "string (id)",
      "quantidade": "number",
      "precoUnitario": "number",
      "desconto": "number"
    }],
    "pagamento": {
      "metodo": "enum(dinheiro, cartao_credito, cartao_debito, pix, boleto)",
      "parcelas": "number",
      "desconto": "number"
    }
  }
  ```

### Financeiro
- **GET** `/financeiro`
  - Query params:
    - tipo: "receita" | "despesa"
    - categoria: string
    - status: "pendente" | "pago" | "atrasado" | "cancelado"
    - dataInicio: date
    - dataFim: date

- **POST** `/financeiro`
  ```json
  {
    "tipo": "enum(receita, despesa)",
    "categoria": "string",
    "descricao": "string",
    "valor": "number",
    "dataVencimento": "date",
    "formaPagamento": "enum(dinheiro, cartao_credito, cartao_debito, pix, boleto, transferencia)",
    "recorrente": "boolean",
    "periodicidade": "enum(mensal, bimestral, trimestral, semestral, anual)"
  }
  ```

## Códigos de Erro
- 400: Erro de validação ou dados inválidos
- 401: Não autenticado
- 403: Não autorizado
- 404: Recurso não encontrado
- 500: Erro interno do servidor

## Paginação
Endpoints que retornam listas suportam paginação através dos query params:
- `limite`: Número de itens por página (default: 10)
- `pagina`: Número da página (default: 1)

## Ambiente de Desenvolvimento
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Criar usuário admin inicial
npm run init-admin
