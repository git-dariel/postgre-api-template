const appErrorMarker = Symbol("appError");

export type AppError = Error & {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly [appErrorMarker]: true;
};

export function appError(message: string, statusCode: number, isOperational = true): AppError {
  const error = Object.assign(Error(message), {
    statusCode,
    isOperational,
    [appErrorMarker]: true as const,
  });

  Error.captureStackTrace(error, appError);

  return error;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && appErrorMarker in error;
}

export function notFoundError(message = "Resource not found"): AppError {
  return appError(message, 404);
}

export function badRequestError(message = "Bad request"): AppError {
  return appError(message, 400);
}

export function conflictError(message = "Resource already exists"): AppError {
  return appError(message, 409);
}
