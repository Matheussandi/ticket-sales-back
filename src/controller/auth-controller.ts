import { Router } from "express";
import {
  AuthService,
  InvalidCredentialsError,
} from "../services/auth-service.ts";
import {
  authCookieName,
  getAuthClearCookieOptions,
  getAuthCookieOptions,
} from "../config/auth-cookie.ts";

export const authRouter = Router();

authRouter.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.status(200).json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const authService = new AuthService();
  try {
    const { token, user } = await authService.login(email, password);
    const name = authCookieName();
    res.cookie(name, token, getAuthCookieOptions());
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie(authCookieName(), getAuthClearCookieOptions());
  res.status(200).json({ message: "Logout successful" });
});
