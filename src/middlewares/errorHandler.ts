import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { logger } from "../lib/logger";

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    logger.warn(error.message);

    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  logger.error(error);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
