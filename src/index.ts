import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import routes from './routes'

dotenv.config();
const port = process.env.PORT;

const app: Express = express();
app.use(express.urlencoded({ extended: true }))


app.get('/', (_: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use(routes);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});