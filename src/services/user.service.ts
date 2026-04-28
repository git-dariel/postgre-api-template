import type { User, CreateUserDTO, UpdateUserDTO } from "../models/user.model";
import { UserRepository } from "../repositories/user.repository";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error("User with that email already exists.");
    }

    return this.userRepository.create(data);
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const updatedUser = await this.userRepository.update(id, data);

    if (!updatedUser) {
      throw new Error("User not found.");
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new Error("User not found.");
    }
  }
}
