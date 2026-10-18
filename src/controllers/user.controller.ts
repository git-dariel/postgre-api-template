import type { Request, Response } from "express";
import userService from "../services/user.service.js";

const userController = {
  getAll,
  getById,
  create,
  update,
  remove,
};

export default userController;

async function getAll(_req: Request, res: Response): Promise<void> {
  const users = await userService.getAll();

  res.status(200).json({
    success: true,
    data: users,
  });
}

async function getById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const id = Number(req.params.id);

  const user = await userService.getById(id);

  res.status(200).json({
    success: true,
    data: user,
  });
}

async function create(req: Request, res: Response): Promise<void> {
  const user = await userService.create(req.body);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user,
  });
}

async function update(req: Request<{ id: string }>, res: Response): Promise<void> {
  const id = Number(req.params.id);

  const user = await userService.update(id, req.body);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
}

async function remove(req: Request<{ id: string }>, res: Response): Promise<void> {
  const id = Number(req.params.id);

  await userService.remove(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
}
