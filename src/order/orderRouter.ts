
import express from "express"
import authenticate from "../common/middleware/authenticate.js"
import { asyncWrapper } from "../utils.js"
import { OrderController } from "./orderController.js"
const router = express.Router()


const orderController = new OrderController()

router.post("/", authenticate, asyncWrapper(orderController.create))

export default router