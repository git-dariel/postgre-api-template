import type { Request, Response, NextFunction } from "express";
import { badRequestError } from "../utils/appError";

export function validateBody(...requiredFields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => !(field in req.body));

    if (missingFields.length > 0) {
      next(badRequestError(`Missing required fields: ${missingFields.join(", ")}`));
      return;
    }

    next();
  };
}
