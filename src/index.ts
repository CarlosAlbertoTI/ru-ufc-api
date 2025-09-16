import express, { Express } from "express";
import dotenv from "dotenv";

import { decryptRequest } from "./middlleware/decode";
import { encryptResponse } from "./middlleware/encode";
import { authenticateToken } from "./middlleware/Authentication";

import routes from "./routes";
import { decrypt, encrypt } from "./service/Encrypt/Index";

dotenv.config();
const port = process.env.PORT;

const app: Express = express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.post("/test/encrypt", (req, res) => {
  const file = req.body;
  if (typeof file !== "object" || file === null || Array.isArray(file)) {
    return res
      .status(400)
      .json({ error: "Request body must be a JSON object" });
  }

  const encrypted = encrypt(JSON.stringify(file));
  res.json({ encrypted });
});

app.post("/test/decrypt", (req, res) => {
  const { data } = req.body;

  var typeCheck = typeof data;

  if (!typeCheck.includes("string")) {
    return res
      .status(400)
      .json({ error: "Request body must contain a 'data' string" });
  }

  try {
    const decrypted = decrypt(data);
    res.json({ data: JSON.parse(decrypted) });
  } catch (error) {
    console.error("Decryption error:", error);
    res.status(400).json({ error: "Failed to decrypt string" });
  }
});

app.use(authenticateToken);

app.use(decryptRequest);

app.use(routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    ...err,
    error: err.error || err.message || "Internal Server Error"
  });
});

app.use(encryptResponse);



app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
