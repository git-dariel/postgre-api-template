import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../utils/appError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.originalUrl}`));
}
