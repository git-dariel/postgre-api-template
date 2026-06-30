import type { Request, Response } from "express";
import { UserService } from "../services/user.service.js";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  };

  getUserById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const user = await this.userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  createUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  };

  updateUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const user = await this.userService.updateUser(id, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  };

  deleteUser = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    await this.userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  };
}
