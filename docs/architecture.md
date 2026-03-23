# 🏗️ Arquitetura do Projeto

Este documento descreve a arquitetura do sistema de vendas de ingressos, incluindo a organização de camadas, fluxo de dados e responsabilidades de cada componente.

## Visão Geral

O projeto segue uma arquitetura em camadas baseada no padrão **MVC (Model-View-Controller)**, adaptada para APIs REST. Como não há views (interface gráfica), o padrão é essencialmente **MC (Model-Controller)** com uma camada adicional de **Services**.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente HTTP                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express App (app.ts)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Middlewares                           │ │
│  │  • JSON Parser + cookie-parser                          │ │
│  │  • CORS + Autenticação JWT (cookie httpOnly / Bearer)   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Controllers                             │
│  auth-controller │ customer-controller │ partner-controller │
│  events-controller │ ticket-controller │ purchase-controller│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Services                              │
│  AuthService │ CustomerService │ PartnerService             │
│  EventService │ TicketService │ PurchaseService             │
│  PaymentService │ UserService                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Models                               │
│  UserModel │ CustomerModel │ PartnerModel │ EventModel      │
│  TicketModel │ PurchaseModel │ ReservationTicketModel       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                          │
│                   Pool de Conexões                           │
└─────────────────────────────────────────────────────────────┘
```

## Camadas da Aplicação

### 1. Camada de Apresentação (Controllers)

**Localização**: `src/controller/`

**Responsabilidades**:
- Receber requisições HTTP
- Validar parâmetros de entrada básicos
- Delegar processamento para os Services
- Retornar respostas HTTP apropriadas

**Arquivos**:
| Controller | Responsabilidade |
|------------|------------------|
| `auth-controller.ts` | Login e autenticação |
| `customer-controller.ts` | Cadastro de clientes |
| `partner-controller.ts` | Cadastro e operações de parceiros |
| `events-controller.ts` | CRUD de eventos (público) |
| `ticket-controller.ts` | Gerenciamento de tickets |
| `purchase-controller.ts` | Processamento de compras |

### 2. Camada de Negócio (Services)

**Localização**: `src/services/`

**Responsabilidades**:
- Implementar regras de negócio
- Orquestrar operações entre múltiplos Models
- Gerenciar transações de banco de dados
- Processar dados antes de persistir

**Arquivos**:
| Service | Responsabilidade |
|---------|------------------|
| `auth-service.ts` | Validação de credenciais, geração de JWT |
| `customer-service.ts` | Registro de clientes com transação |
| `partner-service.ts` | Registro de parceiros com transação |
| `event-service.ts` | CRUD de eventos |
| `ticket-service.ts` | Criação em lote e consulta de tickets |
| `purchase-service.ts` | Processamento de compras com reserva |
| `payment-service.ts` | Integração com gateway de pagamento |
| `user-service.ts` | Operações base de usuários |

### 3. Camada de Dados (Models)

**Localização**: `src/model/`

**Responsabilidades**:
- Representar entidades do domínio
- Interagir diretamente com o banco de dados
- Implementar operações CRUD
- Mapear resultados SQL para objetos

**Arquivos**:
| Model | Entidade |
|-------|----------|
| `user-model.ts` | Usuários base do sistema |
| `customer-model.ts` | Clientes (extensão de User) |
| `partner-model.ts` | Parceiros (extensão de User) |
| `event-model.ts` | Eventos |
| `ticket-model.ts` | Ingressos |
| `purchase-model.ts` | Compras |
| `reservation-ticket-model.ts` | Reservas de tickets |

### 4. Camada de Infraestrutura

**Localização**: `src/database.ts`

**Responsabilidades**:
- Gerenciar pool de conexões MySQL
- Fornecer conexões para transações
- Configurar parâmetros de conexão

## Fluxo de Dados

### Exemplo: Fluxo de Compra de Tickets

```
1. Cliente envia POST /purchases
         │
         ▼
2. purchase-controller.ts
   - Extrai dados do request
   - Valida se usuário é cliente
         │
         ▼
3. purchase-service.ts
   - Busca customer
   - Valida tickets disponíveis
   - Calcula valor total
   - Inicia transação
         │
         ▼
4. purchase-model.ts
   - Cria registro de compra
         │
         ▼
5. ticket-model.ts
   - Associa tickets à compra
         │
         ▼
6. reservation-ticket-model.ts
   - Cria reserva dos tickets
         │
         ▼
7. payment-service.ts
   - Processa pagamento
         │
         ▼
8. Commit ou Rollback da transação
         │
         ▼
9. Retorna resposta ao cliente
```

## Diagrama de Entidades

```
┌─────────────┐       ┌─────────────┐
│    User     │───────│   Partner   │
│             │       │             │
│ id          │       │ id          │
│ name        │       │ user_id     │
│ email       │       │ company_name│
│ password    │       │ created_at  │
│ created_at  │       └──────┬──────┘
└──────┬──────┘              │
       │                     │ cria
       │              ┌──────▼──────┐
       │              │    Event    │
       │              │             │
       │              │ id          │
       │              │ name        │
       │              │ description │
       │              │ date        │
       │              │ location    │
       │              │ partner_id  │
       │              │ created_at  │
       │              └──────┬──────┘
       │                     │ possui
┌──────▼──────┐       ┌──────▼──────┐
│  Customer   │       │   Ticket    │
│             │       │             │
│ id          │       │ id          │
│ user_id     │       │ event_id    │
│ address     │       │ location    │
│ phone       │       │ price       │
│ created_at  │       │ status      │
└──────┬──────┘       │ created_at  │
       │              └──────┬──────┘
       │ realiza             │
       │              ┌──────▼──────┐
┌──────▼──────┐       │  Purchase   │
│  Purchase   │◄──────│   Ticket    │
│             │       │   (N:N)     │
│ id          │       └─────────────┘
│ customer_id │
│ total_amount│
│ status      │
│ purchase_dt │
└─────────────┘
```

## Autenticação e Autorização

### Fluxo de Autenticação

```
1. POST /auth/login (email, password)
         │
         ▼
2. AuthService.login()
   - Busca usuário por email
   - Compara hash da senha (bcrypt)
   - Gera token JWT
         │
         ▼
3. AuthController define Set-Cookie (httpOnly, path, sameSite, secure)
   e responde JSON { user: { id, name, email, role } } (sem token no corpo)
```

O cliente web deve enviar requisições com **credenciais** (`credentials: 'include'` em `fetch`) para o navegador anexar o cookie. O **CORS** usa `credentials: true` e `CORS_ORIGIN` deve ser a origem exata do front (sem wildcard).

### Middleware de Autorização

```
Requisição à rota protegida
         │
         ▼
Middleware (após cookie-parser)
   - Verifica se rota é protegida
   - Obtém JWT: cookie httpOnly (nome em JWT_COOKIE_NAME) ou,
     para ferramentas, header Authorization: Bearer <token>
   - Valida JWT e busca usuário no banco
   - Anexa user ao request
         │
         ▼
Controller recebe req.user
```

### Logout

`POST /auth/logout` é rota pública: remove o cookie com as mesmas opções de `path` / `sameSite` / `secure` usadas no login (evita sessão “presa” quando o JWT já expirou).

### Sessão atual

`GET /auth/me` (rota protegida) retorna `{ user: { id, name, email, role } }` com base em `req.user` após validação do JWT — útil para hidratar o front após reload ou validar cookie.

### Rotas Não Protegidas

- `POST /auth/login`
- `POST /auth/logout`
- `POST /customers/register`
- `POST /partners/register`
- `GET /events` e `GET /events/:eventId`

## Gestão de Transações

O sistema utiliza transações de banco de dados para operações que envolvem múltiplas tabelas:

```typescript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  
  // Operações múltiplas
  await Model1.create(..., { connection });
  await Model2.create(..., { connection });
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Operações Transacionais**:
- Registro de Customer (User + Customer)
- Registro de Partner (User + Partner)
- Processamento de Compra (Purchase + associação de tickets + reserva)

## Pool de Conexões

```typescript
// Configuração em database.ts
{
  host: "localhost",
  user: "root",
  password: "root",
  database: "tickets",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,      // Máximo de conexões simultâneas
  queueLimit: 0             // Sem limite de fila
}
```

## Considerações de Escalabilidade

1. **Stateless**: Autenticação via JWT permite escalar horizontalmente
2. **Connection Pool**: Reutilização de conexões com o banco
3. **Transações**: Garantem consistência em operações críticas
4. **Separação de Camadas**: Facilita manutenção e testes
