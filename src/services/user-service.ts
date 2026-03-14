import { UserModel } from "../model/user-model.ts";
import { CustomerModel } from "../model/customer-model.ts";

export class InvalidPasswordError extends Error {
  constructor() {
    super("Current password is incorrect");
    this.name = "InvalidPasswordError";
  }
}

export class UserService {
  async findById(userId: number) {
    return UserModel.findById(userId);
  }

  async findByEmail(email: string) {
    return UserModel.findByEmail(email);
  }

  async updateProfile(
    userId: number,
    role: "customer" | "partner",
    data: { name?: string; email?: string; phone?: string },
  ) {
    const { name, email, phone } = data;

    if (!name && !email && !phone) {
      throw new Error("At least one field must be provided");
    }

    if (phone && role !== "customer") {
      throw new Error("Phone update is only available for customers");
    }

    if (email) {
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email already in use");
      }
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.update();

    let updatedPhone: string | undefined;

    if (phone && role === "customer") {
      const customer = await CustomerModel.findByUserId(userId);
      if (!customer) {
        throw new Error("Customer not found");
      }
      customer.phone = phone;
      await customer.update();
      updatedPhone = customer.phone;
    }

    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, ...(updatedPhone !== undefined && { phone: updatedPhone }) };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!UserModel.comparePassword(currentPassword, user.password!)) {
      throw new InvalidPasswordError();
    }

    user.password = UserModel.hashPassword(newPassword);
    await user.update();
  }
}
