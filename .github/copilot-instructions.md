# Copilot Instructions - Sistema de Vendas de Ingressos

## Visão Geral do Projeto

Este é um sistema de vendas de ingressos para eventos, desenvolvido como uma API REST com Node.js, TypeScript, Express e MySQL. O sistema permite que parceiros criem eventos e gerenciem tickets, enquanto clientes podem visualizar eventos e realizar compras.

## Estrutura de Documentação

Antes de responder perguntas sobre o projeto, consulte os seguintes arquivos:

| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Visão geral, instalação, endpoints da API |
| `docs/system-requirements.md` | Requisitos funcionais e não funcionais, regras de negócio |
| `docs/technologies.md` | Stack tecnológica, bibliotecas, versões |
| `docs/architecture.md` | Arquitetura em camadas, fluxo de dados, diagramas |
| `docs/patterns.md` | Padrões de projeto, convenções de código |

## Arquitetura do Projeto

```
src/
├── app.ts              # Aplicação principal, middlewares, rotas
├── database.ts         # Pool de conexões MySQL (Singleton)
├── controller/         # Controladores HTTP (recebem requests)
├── services/           # Regras de negócio
├── model/              # Active Record (entidades + persistência)
└── types/              # Definições de tipos TypeScript
```

### Fluxo de Dados
```
Request → Controller → Service → Model → Database
```

## Convenções de Código

### Nomenclatura
- **Arquivos**: kebab-case (`purchase-service.ts`)
- **Classes**: PascalCase (`PurchaseService`)
- **Métodos/Variáveis**: camelCase (`findByUserId`)
- **Constantes**: UPPER_SNAKE_CASE (`AVAILABLE`)
- **Tabelas/Colunas BD**: snake_case (`created_at`)

### Padrões Utilizados
- **Active Record**: Models sabem persistir a si mesmos
- **Singleton**: Database pool de conexões
- **Service Layer**: Regras de negócio isoladas dos controllers
- **Factory Method**: Métodos `static create()` nos Models

### Exemplo de Model (Active Record)
```typescript
class ExampleModel {
  id: number;
  name: string;
  created_at: Date;

  static async create(data: {...}): Promise<ExampleModel>
  static async findById(id: number): Promise<ExampleModel | null>
  static async findAll(filter?: {...}): Promise<ExampleModel[]>
  async update(): Promise<void>
}
```

### Exemplo de Service
```typescript
class ExampleService {
  async create(data: {...}) {
    // Regras de negócio
    // Pode usar transações para múltiplas operações
    return await ExampleModel.create(data);
  }
}
```

### Transações de Banco de Dados
```typescript
const connection = await Database.getInstance().getConnection();
try {
  await connection.beginTransaction();
  // Operações com { connection }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## Autenticação

- **JWT** no header `Authorization: Bearer <token>`
- Token contém: `{ id, name, email, role }`
- Expiração: 1 hora
- Rotas públicas definidas em `app.ts` no array `unprotectedPaths`

## Entidades do Sistema

| Entidade | Descrição |
|----------|-----------|
| `User` | Base de autenticação (email, password) |
| `Customer` | Cliente que compra tickets (extends User) |
| `Partner` | Parceiro que cria eventos (extends User) |
| `Event` | Evento com data, local, descrição |
| `Ticket` | Ingresso com status (available, reserved, sold) |
| `Purchase` | Compra com status (pending, paid, error, canceled) |
| `ReservationTicket` | Reserva temporária de ticket |

## Status de Tickets
- `available` - Disponível para compra
- `reserved` - Reservado temporariamente
- `sold` - Vendido

## Status de Compras
- `pending` - Aguardando pagamento
- `paid` - Pago com sucesso
- `error` - Erro no processamento
- `canceled` - Cancelado

## Endpoints da API

### Rotas Públicas (sem autenticação)
- `POST /auth/login`
- `POST /customers/register`
- `POST /partners/register`
- `GET /events`
- `GET /events/:eventId`

### Rotas Protegidas (requer JWT)
- `GET /partners`
- `POST /partners/events`
- `GET /partners/events`
- `GET /partners/events/:eventId`
- `POST /events`
- `POST /events/:eventId/tickets` (apenas parceiros)
- `GET /events/:eventId/tickets`
- `GET /events/:eventId/tickets/:ticketId`
- `POST /purchases` (apenas clientes)

## Tecnologias Principais

- **Runtime**: Node.js 22.15.1+ (com --experimental-strip-types)
- **Linguagem**: TypeScript 5.9+
- **Framework**: Express 5.2+
- **Banco de Dados**: MySQL 8.x via mysql2/promise
- **Autenticação**: JWT (jsonwebtoken)
- **Criptografia**: bcrypt (10 rounds)
- **Containerização**: Docker + Docker Compose

## Regras Importantes

1. **Senhas** sempre são hasheadas com bcrypt antes de salvar
2. **Queries** sempre usar placeholders `?` (nunca concatenar strings)
3. **Transações** para operações que envolvem múltiplas tabelas
4. **Validação de propriedade** antes de operações (ex: parceiro só gerencia seus eventos)
5. **Tickets** são criados em lote pelo parceiro dono do evento
6. **Compras** só podem ser feitas por clientes autenticados

## Comandos Úteis

```bash
npm run dev      # Inicia em modo desenvolvimento
npm run build    # Compila TypeScript
npm start        # Executa versão compilada
docker-compose up -d  # Inicia MySQL
```

## Ao Gerar Código

1. Siga os padrões existentes de nomenclatura
2. Use TypeScript com tipos explícitos
3. Implemente tratamento de erros apropriado
4. Use transações para operações multi-tabela
5. Valide permissões antes de operações sensíveis
6. Retorne códigos HTTP apropriados (200, 201, 400, 401, 403, 404, 500)
