import type { Request, Response, NextFunction } from "express";
import { isAppError } from "../utils/appError";
import { logger } from "../lib/logger";

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(error)) {
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
