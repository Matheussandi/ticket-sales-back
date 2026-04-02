# 🎫 Sistema de Vendas de Ingressos

## 📋 Sobre o Projeto

API de vendas de ingressos para eventos (Node.js, TypeScript, Express, MySQL). Parceiros gerenciam eventos e ingressos; clientes consultam eventos e realizam compras.

**Docker:** `Dockerfile` + `docker-compose.yml` — MySQL sozinho ou API + MySQL; no segundo caso não precisa de `npm install` na máquina.

## 📖 Aprendizado

Além da API, o projeto também teve como foco aprender **Docker** (ambiente local e containerização) e **deploy na AWS** em produção.

## 🚀 Início Rápido

**API na máquina, MySQL no Docker**

```bash
npm install && cp .env.example .env
docker compose up -d mysql
npm run dev
```

**API e MySQL no Docker** — não precisa de `npm install` na máquina. API: **http://localhost:8080**. MySQL: `localhost:3306` (`root` / `root`, banco `tickets`).

```bash
docker compose up --build
# segundo plano: docker compose up -d --build
```

Parar: `docker compose down`. Opcional: `.env` na raiz (senão valem os padrões do `docker-compose.yml`).

## 📁 Estrutura do Projeto

```
vendas-ingresso/
├── src/
│   ├── app.ts              # App e rotas
│   ├── database.ts         # Pool MySQL
│   ├── controller/
│   ├── model/
│   ├── services/
│   └── types/
├── docs/
│   ├── system-requirements.md
│   ├── technologies.md
│   ├── architecture.md
│   └── patterns.md
├── bru/                    # Coleção Bruno (HTTP)
├── Dockerfile
├── docker-compose.yml
├── init.sql
└── package.json
```

## 🛠️ Scripts Disponíveis

```bash
npm run dev    # Desenvolvimento com hot-reload
npm start      # Executa a aplicação (TypeScript nativo via Node)
```

## 📝 Convenções

- **Autenticação**: cookie **httpOnly** — [`src/config/auth-cookie.ts`](src/config/auth-cookie.ts), [`src/middlewares/auth-middleware.ts`](src/middlewares/auth-middleware.ts).
- **Senhas**: bcrypt (10 rounds).
- **Timestamps**: objetos `Date`.

## 📚 Documentação Detalhada

- [Requisitos do Sistema](docs/system-requirements.md)
- [Tecnologias Utilizadas](docs/technologies.md)
- [Arquitetura do Projeto](docs/architecture.md)
- [Padrões de Projeto](docs/patterns.md)

Rotas e exemplos de requisição também podem ser explorados na pasta `bru/` (Bruno).

## 🐛 Debug no VS Code

1. Breakpoints na margem do editor.
2. `F5` para iniciar o debug (Node.js 22+).
3. Bruno ou outro cliente HTTP para exercitar a API.

## 🤝 Contribuindo

Sugestões e contribuições são bem-vindas.
