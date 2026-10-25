import { hash } from "bcryptjs";
import type { User, Prisma } from "../../generated/prisma/client";
import userRepository from "../repositories/user.repository";
import {
  badRequestError,
  conflictError,
  notFoundError,
} from "../utils/appError";

const PASSWORD_SALT_ROUNDS = 12;

export type PublicUser = Omit<User, "password">;

const userService = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default userService;

async function getAll(): Promise<PublicUser[]> {
  const users = await userRepository.getAll();

  return users.map(toPublicUser);
}

async function getById(id: number): Promise<PublicUser> {
  const user = await userRepository.getById(id);

  if (!user) {
    throw notFoundError("User not found.");
  }

  return toPublicUser(user);
}

async function create(data: Prisma.UserCreateInput): Promise<PublicUser> {
  const existingUser = await userRepository.findByEmail(data.email);

  if (existingUser) {
    throw conflictError("User with that email already exists.");
  }

  const password = await hash(data.password, PASSWORD_SALT_ROUNDS);
  const user = await userRepository.create({ ...data, password });

  return toPublicUser(user);
}

async function update(
  id: number,
  data: Prisma.UserUpdateInput,
): Promise<PublicUser> {
  const updateData = { ...data };

  if (data.password !== undefined) {
    if (typeof data.password !== "string") {
      throw badRequestError("Password must be a string.");
    }

    updateData.password = await hash(data.password, PASSWORD_SALT_ROUNDS);
  }

  const updatedUser = await userRepository.update(id, updateData);

  if (!updatedUser) {
    throw notFoundError("User not found.");
  }

  return toPublicUser(updatedUser);
}

async function remove(id: number): Promise<void> {
  const deleted = await userRepository.remove(id);

  if (!deleted) {
    throw notFoundError("User not found.");
  }
}

function toPublicUser(user: User): PublicUser {
  const { password: _password, ...publicUser } = user;

  return publicUser;
}
