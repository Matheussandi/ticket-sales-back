import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/user-service.ts";

/**
 * Rotas que não requerem autenticação JWT
 * 
 * Estas rotas são públicas e podem ser acessadas sem token de autenticação:
 * - Login de usuários
 * - Registro de novos clientes e parceiros
 * - Visualização pública de eventos
 * - Rota raiz para healthcheck
 */
export const unprotectedPaths = [
  { method: "GET", path: "/" },
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/customers/register" },
  { method: "POST", path: "/partners/register" },
  { method: "GET", path: "/events" },
];

/**
 * Middleware de autenticação JWT
 * 
 * Verifica se a rota requer autenticação e valida o token JWT.
 * Se a rota for protegida:
 * 1. Extrai o token do header Authorization (Bearer <token>)
 * 2. Verifica a validade do token usando a chave secreta
 * 3. Busca o usuário no banco de dados
 * 4. Anexa os dados do usuário ao objeto request (req.user)
 * 
 * @param req - Request do Express
 * @param res - Response do Express
 * @param next - Função para passar para o próximo middleware
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Verifica se a rota está na lista de rotas não protegidas
  const isUnprotectedRoute = unprotectedPaths.some((route) => {
    if (route.method !== req.method) return false;
    
    // Comparação exata para path raiz
    if (route.path === "/") return req.path === "/";
    
    // Para outros paths, permite subpaths
    return req.path === route.path || req.path.startsWith(route.path + "/");
  });

  // Se a rota for pública, pula a validação de autenticação
  if (isUnprotectedRoute) {
    return next();
  }

  // Extrai o token do header Authorization: Bearer <token>
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verifica e decodifica o token JWT
    const jwtSecret = process.env.JWT_SECRET || "your_secret_key";
    const payload = jwt.verify(token, jwtSecret) as {
      id: number;
      name: string;
      email: string;
      role: 'customer' | 'partner';
    };

    // Busca o usuário no banco de dados
    const userService = new UserService();
    const user = await userService.findById(payload.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Anexa o usuário ao request para uso nos controllers
    req.user = { id: user.id, name: user.name, email: user.email, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
