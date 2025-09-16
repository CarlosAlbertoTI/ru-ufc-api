import { decrypt } from "../../service/Encrypt/Index";

import { Request, NextFunction } from "express";

export function decryptRequest(
  req: Request,
  res: any,
  next: NextFunction
) {
  const data = req.body.data;
  if (data && typeof data === "string") {
    req.body = JSON.parse(decrypt(data));
  }
  next();
}
