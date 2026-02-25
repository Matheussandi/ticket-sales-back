import { UserModel } from "../model/user-model.ts";

export class UserService {
  async findById(userId: number) {
    return UserModel.findById(userId);
  }

  async findByEmail(email: string) {
    return UserModel.findByEmail(email);
  }

  async updateProfile(userId: number, data: { name?: string; email?: string; password?: string }) {
    const { name, email, password } = data;

    // Validar que ao menos um campo foi fornecido
    if (!name && !email && !password) {
      throw new Error("At least one field must be provided");
    }

    // Se email for fornecido, verificar unicidade
    if (email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email already in use");
      }
    }

    // Buscar usuário atual
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Atualizar campos fornecidos
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = await UserModel.hashPassword(password);
    }

    // Salvar alterações
    await user.update();

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
