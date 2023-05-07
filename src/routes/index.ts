import {Router} from 'express'
import { getMyMealTicket } from '../controller/getMyMeal.controller'

const routes = Router()

routes.get('/getMyMealTickets', getMyMealTicket)

export default routes