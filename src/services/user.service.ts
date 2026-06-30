import type { User, Prisma } from "../../generated/prisma/client";
import { UserRepository } from "../repositories/user.repository";
import { NotFoundError, ConflictError } from "../utils/appError";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictError("User with that email already exists.");
    }

    return this.userRepository.create(data);
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    const updatedUser = await this.userRepository.update(id, data);

    if (!updatedUser) {
      throw new NotFoundError("User not found.");
    }

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError("User not found.");
    }
  }
}
