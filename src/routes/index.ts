import {Router} from 'express'
import { getMyMealTicket,getMenuOfTheDay } from '../controller/getMyMeal.controller'

const routes = Router()

routes.get('/getMyMealTickets', getMyMealTicket)
routes.get('/getTodayMenu', getMenuOfTheDay)

export default routes