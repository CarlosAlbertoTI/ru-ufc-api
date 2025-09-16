import { Request, Response, NextFunction } from "express";

import { AUTH_HEADER, BEARER_PREFIX } from "../../utils/constants";

import dotenv from "dotenv";
dotenv.config();

function validateToken(token: string): boolean {
  return token === process.env.TOKEN;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers[AUTH_HEADER] as string | undefined;

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(BEARER_PREFIX.length);

  if (!validateToken(token)) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  next();
}
