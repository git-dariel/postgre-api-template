import type { Request, Response, NextFunction } from "express";
import { notFoundError } from "../utils/appError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(notFoundError(`Route not found: ${req.originalUrl}`));
}
