import { Router } from "express";

import { getMenuOfTheDay } from "../controller/getMyMeal.controller";
import { getMyMealTicket, buyTickets } from "../controller/tickets.controller";

const routes = Router();

routes.post("/getMyMealTickets", getMyMealTicket);
routes.post("/getTodayMenu", getMenuOfTheDay);
routes.post("/buyTickets", buyTickets);

export default routes;
