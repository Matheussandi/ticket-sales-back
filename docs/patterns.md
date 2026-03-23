# 📐 Padrões de Projeto

Este documento descreve os padrões de projeto e convenções utilizados no sistema de vendas de ingressos.

## Padrões Arquiteturais

### MVC (Model-View-Controller)

O projeto segue uma variação do padrão MVC adaptada para APIs REST:

- **Model**: Classes em `src/model/` que representam entidades e interagem com o banco
- **Controller**: Classes em `src/controller/` que lidam com requisições HTTP
- **View**: Não aplicável (API REST retorna JSON)

### Service Layer (Camada de Serviço)

Uma camada adicional entre Controllers e Models que:

- Encapsula regras de negócio
- Orquestra múltiplos Models
- Gerencia transações
- Mantém Controllers "magros"

```
Controller (HTTP) → Service (Negócio) → Model (Dados)
```

## Padrões de Dados

### Active Record

Os Models implementam o padrão **Active Record**, onde cada classe:

- Representa uma tabela do banco de dados
- Contém métodos estáticos para operações CRUD
- Instâncias representam linhas da tabela
- Sabe como persistir a si mesmo

**Exemplo**:
```typescript
class EventModel {
  // Propriedades mapeiam colunas
  id: number;
  name: string;
  date: Date;
  
  // Métodos estáticos para queries
  static async create(data): Promise<EventModel>
  static async findById(id): Promise<EventModel | null>
  static async findAll(): Promise<EventModel[]>
  
  // Métodos de instância para operações no registro
  async update(): Promise<void>
  async delete(): Promise<void>
}
```

### Singleton (Database)

A classe `Database` implementa o padrão **Singleton** para gerenciar o pool de conexões:

```typescript
class Database {
  private static instance: mysql.Pool;
  
  private constructor() {}  // Construtor privado
  
  public static getInstance(): mysql.Pool {
    if (!Database.instance) {
      Database.instance = mysql.createPool({...});
    }
    return Database.instance;
  }
}
```

**Benefícios**:
- Uma única instância do pool em toda aplicação
- Controle centralizado de conexões
- Evita vazamento de conexões

## Padrões de Código

### Injeção de Dependência (Manual)

Os Services recebem dependências via construtor quando necessário:

```typescript
class PurchaseService {
  private paymentService: PaymentService;
  
  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }
}

// Uso
const paymentService = new PaymentService();
const purchaseService = new PurchaseService(paymentService);
```

### Factory Method (Implícito)

Os métodos estáticos `create` nos Models funcionam como Factory Methods:

```typescript
// Em vez de instanciar diretamente
const event = new EventModel({...});
await event.save();

// Usamos o factory method
const event = await EventModel.create({...});
```

### Repository-like Methods

Os Models fornecem métodos de consulta semelhantes ao padrão Repository:

```typescript
class TicketModel {
  static async findAll(filter?: { where?: {...} }): Promise<TicketModel[]>
  static async findById(id: number): Promise<TicketModel | null>
  // ...
}
```

## Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Arquivos | kebab-case | `purchase-service.ts` |
| Classes | PascalCase | `PurchaseService` |
| Métodos | camelCase | `findByUserId()` |
| Variáveis | camelCase | `ticketIds` |
| Constantes | UPPER_SNAKE_CASE | `AVAILABLE` |
| Tabelas BD | snake_case | `reservation_tickets` |
| Colunas BD | snake_case | `created_at` |

### Estrutura de Arquivos

```
src/
├── controller/      # Um arquivo por recurso REST
│   └── {recurso}-controller.ts
├── services/        # Um arquivo por serviço
│   └── {entidade}-service.ts
├── model/           # Um arquivo por entidade
│   └── {entidade}-model.ts
└── types/           # Definições de tipos globais
    └── index.d.ts
```

### Rotas REST

| Operação | Método HTTP | Padrão de Rota |
|----------|-------------|----------------|
| Listar | GET | `/{recursos}` |
| Obter um | GET | `/{recursos}/:id` |
| Criar | POST | `/{recursos}` |
| Atualizar | PUT/PATCH | `/{recursos}/:id` |
| Deletar | DELETE | `/{recursos}/:id` |
| Recursos aninhados | - | `/{pai}/:paiId/{filhos}` |

**Exemplos no projeto**:
```
GET  /events              # Listar eventos
GET  /events/:eventId     # Obter evento
POST /events              # Criar evento
GET  /events/:eventId/tickets      # Tickets de um evento
POST /events/:eventId/tickets      # Criar tickets para evento
```

## Padrões de Autenticação

### JWT (JSON Web Token)

**Estrutura do Token**:
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Configuração**:
- Algoritmo: HS256 (default)
- Expiração: 1 hora
- Secret: `JWT_SECRET` (variável de ambiente)

**Entrega ao cliente**:
- **Navegador**: cookie **httpOnly** no login (`res.cookie`), nome configurável (`JWT_COOKIE_NAME`, padrão `access_token`), com `sameSite` e `secure` via `COOKIE_SAME_SITE` e `COOKIE_SECURE` (ver `.env.example`).
- **Corpo da resposta**: após login, retorna apenas `{ user }`, sem o JWT no JSON.
- **Ferramentas / testes**: o middleware aceita também `Authorization: Bearer <jwt>`.

### Middleware de Autenticação

```typescript
// Rotas públicas definidas explicitamente
const unprotectedPaths = [
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/logout" },
  { method: "POST", path: "/customers/register" },
  // ...
];

// cookie-parser antes do middleware; token = cookie[JWT_COOKIE_NAME] || Bearer
app.use(async (req, res, next) => {
  if (isUnprotectedRoute) return next();
  // Valida token...
  req.user = user;
  next();
});
```

## Padrões de Tratamento de Dados

### Enum-like Constants

Status são definidos como objetos const com tipagem:

```typescript
export const TicketStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
} as const;

export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];
```

### Padrão de Transações

```typescript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  
  // Operações passam a connection
  await Model.create(data, { connection });
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();  // Sempre libera a conexão
}
```

### Options Pattern

Métodos aceitam opções opcionais para customização:

```typescript
static async findById(
  id: number,
  options?: { user?: boolean }  // Carrega relação com User
): Promise<CustomerModel | null>

// Uso
const customer = await CustomerModel.findById(1, { user: true });
```

## Padrões de Erro

### Custom Error Classes

Erros específicos são classes que estendem Error:

```typescript
export class InvalidCredentialsError extends Error {}

// Uso
throw new InvalidCredentialsError();

// Tratamento
if (error instanceof InvalidCredentialsError) {
  res.status(401).json({ message: "Invalid credentials" });
}
```

### Respostas de Erro Padronizadas

```typescript
// Erro de validação/negócio
res.status(400).json({ error: "Mensagem de erro" });

// Não autorizado
res.status(401).json({ error: "Invalid token" });

// Não permitido
res.status(403).json({ message: "Not authorized" });

// Não encontrado
res.status(404).json({ error: "Resource not found" });

// Erro interno
res.status(500).json({ message: "Internal server error" });
```

## Padrões de Segurança

### Hash de Senhas (bcrypt)

```typescript
// Criação de hash
const hashedPassword = bcrypt.hashSync(password, 10);  // 10 rounds

// Comparação
const isValid = bcrypt.compareSync(plainPassword, hashedPassword);
```

### Validação de Propriedade

Antes de operações, validar que o recurso pertence ao usuário:

```typescript
// Verificar se parceiro é dono do evento
const partner = await partnerService.findByUserId(userId);
const event = await eventService.findById(eventId);

if (!event || event.partner_id !== partner.id) {
  return res.status(404).json({ message: "Event not found" });
}
```

## Padrões de Banco de Dados

### Queries Parametrizadas

Sempre usar placeholders para prevenir SQL Injection:

```typescript
// ✅ Correto
await db.execute(
  "SELECT * FROM users WHERE email = ?",
  [email]
);

// ❌ Incorreto (vulnerável)
await db.execute(`SELECT * FROM users WHERE email = '${email}'`);
```

### Criação em Lote

Para inserções múltiplas, construir query única:

```typescript
const values = Array(data.length).fill("(?, ?, ?)").join(", ");
const params = data.flatMap(item => [item.a, item.b, item.c]);

await db.execute(
  `INSERT INTO table (a, b, c) VALUES ${values}`,
  params
);
```

## Futuras Melhorias Sugeridas

1. **Validação de Input**: Implementar Zod ou Joi para validação de schemas
2. **Logging**: Adicionar sistema de logs estruturado (Winston/Pino)
3. **Testes**: Implementar testes unitários e de integração
4. **Documentação API**: Adicionar OpenAPI/Swagger
5. **Rate Limiting**: Proteção contra abuso de endpoints
6. **Cache**: Redis para caching de eventos e tickets
