import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/user-service.ts";
import { authCookieName } from "../config/auth-cookie.ts";

/**
 * Rotas que não requerem autenticação JWT
 *
 * Estas rotas são públicas e podem ser acessadas sem token de autenticação:
 * - Login de usuários
 * - Logout (limpa cookie mesmo com sessão expirada)
 * - Registro de novos clientes e parceiros
 * - Visualização pública de eventos
 * - Rota raiz para healthcheck
 */
export const unprotectedPaths = [
  { method: "GET", path: "/" },
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/logout" },
  { method: "POST", path: "/customers/register" },
  { method: "POST", path: "/partners/register" },
  { method: "GET", path: "/events" },
];

/**
 * Middleware de autenticação JWT
 *
 * Verifica se a rota requer autenticação e valida o token JWT.
 * Se a rota for protegida:
 * 1. Extrai o token do cookie httpOnly ou do header Authorization (Bearer)
 * 2. Verifica a validade do token usando a chave secreta
 * 3. Busca o usuário no banco de dados
 * 4. Anexa os dados do usuário ao objeto request (req.user)
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isUnprotectedRoute = unprotectedPaths.some((route) => {
    if (route.method !== req.method) return false;

    if (route.path === "/") return req.path === "/";

    return req.path === route.path || req.path.startsWith(route.path + "/");
  });

  if (isUnprotectedRoute) {
    return next();
  }

  const cookieName = authCookieName();
  const tokenFromCookie = req.cookies?.[cookieName];
  const tokenFromHeader = req.headers["authorization"]?.split(" ")[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your_secret_key";
    const payload = jwt.verify(token, jwtSecret) as {
      id: number;
      name: string;
      email: string;
      role: "customer" | "partner";
    };

    const userService = new UserService();
    const user = await userService.findById(payload.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
