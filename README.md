# 🎫 Sistema de Vendas de Ingressos

> **⚠️ Projeto em Desenvolvimento**
> 
> Este projeto está atualmente em fase de desenvolvimento ativo. Funcionalidades e APIs podem sofrer alterações.

## 📋 Sobre o Projeto

Sistema de vendas de ingressos para eventos, desenvolvido com Node.js, TypeScript, Express e MySQL. O sistema permite que parceiros criem e gerenciem eventos com tickets, enquanto clientes podem visualizar eventos e realizar compras.

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar banco de dados com Docker
docker-compose up -d

# Executar em modo de desenvolvimento
npm run dev
```

## 📁 Estrutura do Projeto

```
vendas-ingresso/
├── src/
│   ├── app.ts              # Aplicação principal e configuração de rotas
│   ├── database.ts         # Configuração do pool de conexões MySQL
│   ├── controller/         # Controladores das rotas HTTP
│   ├── model/              # Modelos de dados (Active Record)
│   ├── services/           # Serviços com regras de negócio
│   └── types/              # Definições de tipos TypeScript
├── docs/                   # Documentação detalhada
│   ├── system-requirements.md  # Requisitos do sistema
│   ├── technologies.md     # Tecnologias utilizadas
│   ├── architecture.md     # Arquitetura do projeto
│   └── patterns.md         # Padrões de projeto
├── bru/                    # Coleção de requisições HTTP (Bruno)
├── docker-compose.yml      # Configuração do MySQL
├── init.sql                # Script de inicialização do banco
└── package.json            # Dependências e scripts
```

## 🔑 Endpoints da API

### Autenticação (`/auth`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/auth/login` | Login de usuário | Não || PUT | `/auth/profile` | Edita dados do usuário logado | Sim |
### Parceiros (`/partners`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/partners` | Listar todos os parceiros | Sim |
| POST | `/partners/register` | Registro de novo parceiro | Não || GET | `/partners/dashboard` | Dashboard com métricas do parceiro | Sim (Partner) || POST | `/partners/events` | Criar evento | Sim |
| GET | `/partners/events` | Listar eventos do parceiro autenticado | Sim |
| GET | `/partners/events/:eventId` | Detalhes de um evento específico | Sim |

### Clientes (`/customers`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/customers/register` | Registro de novo cliente | Não |

### Eventos (`/events`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/events` | Listar todos os eventos | Não |
| GET | `/events/:eventId` | Detalhes de um evento | Não |
| POST | `/events` | Criar evento | Sim |

### Tickets (`/events/:eventId/tickets`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/events/:eventId/tickets` | Criar tickets em lote para um evento | Sim (Parceiro) |
| GET | `/events/:eventId/tickets` | Listar tickets de um evento | Não |
| GET | `/events/:eventId/tickets/:ticketId` | Detalhes de um ticket específico | Não |

### Compras (`/purchases`)
| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/purchases` | Realizar compra de tickets | Sim (Cliente) || GET | `/purchases` | Listar compras do cliente logado | Sim (Cliente) |
## � Detalhes dos Endpoints

### PUT `/auth/profile`
Edita dados do usuário logado (name, email e/ou password).

**Request:**
```json
{
  "name": "Novo Nome",     // opcional
  "email": "novo@email.com", // opcional
  "password": "novasenha"   // opcional
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "customer",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Erros:**
- `400` - Nenhum campo fornecido ou email já em uso
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor

### GET `/partners/dashboard`
Dashboard com métricas do parceiro autenticado.

**Response (200):**
```json
{
  "totalEvents": 15,
  "eventsThisMonth": 3,
  "ticketsSold": 245,
  "totalRevenue": 12450.50
}
```

**Erros:**
- `403` - Usuário não é parceiro ou perfil não encontrado
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor
### GET `/purchases`
Lista todas as compras do cliente logado com detalhes dos tickets e eventos.

**Response (200):**
```json
[
  {
    "id": 1,
    "purchase_date": "2024-01-15T10:30:00.000Z",
    "total_amount": 450.00,
    "status": "paid",
    "tickets": [
      {
        "id": 10,
        "location": "A1",
        "price": 150.00,
        "status": "sold",
        "event": {
          "id": 5,
          "name": "Show de Rock",
          "description": "Festival de rock",
          "date": "2024-02-20T20:00:00.000Z",
          "location": "Estádio Municipal"
        }
      },
      {
        "id": 11,
        "location": "A2",
        "price": 150.00,
        "status": "sold",
        "event": {
          "id": 5,
          "name": "Show de Rock",
          "description": "Festival de rock",
          "date": "2024-02-20T20:00:00.000Z",
          "location": "Estádio Municipal"
        }
      }
    ]
  }
]
```

**Erros:**
- `403` - Usuário não é cliente ou perfil não encontrado
- `401` - Token inválido ou ausente
- `500` - Erro interno do servidor
## �🛠️ Scripts Disponíveis

```bash
npm run dev    # Desenvolvimento com hot-reload
npm run build  # Build do projeto
npm start      # Executar versão compilada
```

## 📝 Convenções

- **Autenticação**: JWT no header `Authorization: Bearer <token>`
- **Senhas**: Criptografadas com bcrypt (10 rounds)
- **Timestamps**: Armazenados como objetos Date

## 📚 Documentação Detalhada

Para mais informações, consulte a pasta `docs/`:

- [Requisitos do Sistema](docs/system-requirements.md)
- [Tecnologias Utilizadas](docs/technologies.md)
- [Arquitetura do Projeto](docs/architecture.md)
- [Padrões de Projeto](docs/patterns.md)

## 🐛 Debug no VS Code

O projeto está configurado para debug com VS Code usando o Node.js 22+.

1. Adicione breakpoints clicando na margem esquerda do editor
2. Pressione `F5` para iniciar o debug
3. Use Bruno ou qualquer cliente HTTP para testar os endpoints

## 🤝 Contribuindo

Este projeto está em desenvolvimento ativo. Sugestões e contribuições são bem-vindas!