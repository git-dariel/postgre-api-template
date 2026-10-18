import { prisma } from "../lib/prisma";
import type { User, Prisma } from "../../generated/prisma/client";

const userRepository = {
  getAll,
  getById,
  findByEmail,
  create,
  update,
  remove,
};

export default userRepository;

async function getAll(): Promise<User[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
}

async function getById(id: number): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

async function create(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

async function update(id: number, data: Prisma.UserUpdateInput): Promise<User | null> {
  const existingUser = await getById(id);

  if (!existingUser) {
    return null;
  }

  return prisma.user.update({
    where: { id },
    data,
  });
}

async function remove(id: number): Promise<boolean> {
  const existingUser = await getById(id);

  if (!existingUser) {
    return false;
  }

  await prisma.user.delete({
    where: { id },
  });

  return true;
}
