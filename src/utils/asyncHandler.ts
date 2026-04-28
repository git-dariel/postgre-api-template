import type { Request, Response, NextFunction } from "express";

type AsyncFunction<
  Req extends Request = Request,
  Res extends Response = Response,
> = (req: Req, res: Res, next: NextFunction) => Promise<void>;

export function asyncHandler<Req extends Request, Res extends Response>(fn: AsyncFunction<Req, Res>) {
  return function (req: Req, res: Res, next: NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
