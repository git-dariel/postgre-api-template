import { prisma } from "../lib/prisma";
import type { User, Prisma } from "../../generated/prisma/client";

export class UserRepository {
  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User | null> {
    const existingUser = await this.findById(id);

    if (!existingUser) {
      return null;
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<boolean> {
    const existingUser = await this.findById(id);

    if (!existingUser) {
      return false;
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }
}
