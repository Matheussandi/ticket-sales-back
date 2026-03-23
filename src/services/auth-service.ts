import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../model/user-model.ts";

export class AuthService {
  async login(email: string, password: string) {
    const userModel = await UserModel.findByEmail(email);

    if (userModel && bcrypt.compareSync(password, userModel.password || "")) {
      const jwtSecret = process.env.JWT_SECRET || "your_secret_key";
      const token = jwt.sign(
        {
          id: userModel.id,
          name: userModel.name,
          email: userModel.email,
          role: userModel.role,
        },
        jwtSecret,
        { expiresIn: "1h" }
      );

      return {
        token,
        user: {
          id: userModel.id,
          name: userModel.name,
          email: userModel.email,
          role: userModel.role!,
        },
      };
    } else {
      throw new InvalidCredentialsError();
    }

  }
}

export class InvalidCredentialsError extends Error {}
