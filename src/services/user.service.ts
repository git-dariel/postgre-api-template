import type { User, Prisma } from "../../generated/prisma/client";
import userRepository from "../repositories/user.repository";
import { conflictError, notFoundError } from "../utils/appError";

const userService = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default userService;

async function getAll(): Promise<User[]> {
  return userRepository.getAll();
}

async function getById(id: number): Promise<User> {
  const user = await userRepository.getById(id);

  if (!user) {
    throw notFoundError("User not found.");
  }

  return user;
}

async function create(data: Prisma.UserCreateInput): Promise<User> {
  const existingUser = await userRepository.findByEmail(data.email);

  if (existingUser) {
    throw conflictError("User with that email already exists.");
  }

  return userRepository.create(data);
}

async function update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
  const updatedUser = await userRepository.update(id, data);

  if (!updatedUser) {
    throw notFoundError("User not found.");
  }

  return updatedUser;
}

async function remove(id: number): Promise<void> {
  const deleted = await userRepository.remove(id);

  if (!deleted) {
    throw notFoundError("User not found.");
  }
}
