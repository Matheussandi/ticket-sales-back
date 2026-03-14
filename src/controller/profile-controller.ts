import { Router } from "express";
import { UserService, InvalidPasswordError } from "../services/user-service.ts";

export const profileRouter = Router();

profileRouter.put("/", async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user!.id;
  const role = req.user!.role;

  if (!name && !email && !phone) {
    return res.status(400).json({ message: "At least one field must be provided" });
  }

  try {
    const userService = new UserService();
    const updatedUser = await userService.updateProfile(userId, role, { name, email, phone });
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "Email already in use" ||
        error.message === "At least one field must be provided" ||
        error.message === "Phone update is only available for customers"
      ) {
        return res.status(400).json({ message: error.message });
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

profileRouter.put("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  try {
    const userService = new UserService();
    await userService.changePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof InvalidPasswordError) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});
