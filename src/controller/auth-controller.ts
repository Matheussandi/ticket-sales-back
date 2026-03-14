import { Router } from "express";
import { AuthService, InvalidCredentialsError } from "../services/auth-service.ts";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const authService = new AuthService();
  try {
    const token = await authService.login(email, password);
    res.status(200).json(token);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/logout", async (req, res) => {
  // Com JWT stateless, o logout é feito no cliente removendo o token
  // Esta rota serve para confirmação e pode ser estendida para blacklist de tokens
  res.status(200).json({ message: "Logout successful" });
});
