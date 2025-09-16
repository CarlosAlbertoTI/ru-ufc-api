import { Request, Response } from "express";
import { encrypt } from "../../service/Encrypt/Index";

export function encryptResponse(req: Request, res: Response) {
  const data = req.data;

  if (data === undefined) {
    return res.json("");
  }

  const encryptData = encrypt(
    typeof data === "string" ? data : JSON.stringify(data)
  );
  res.json({ data: encryptData });
}
