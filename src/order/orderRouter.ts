
import express from "express"
import authenticate from "../common/middleware/authenticate.js"
import { asyncWrapper } from "../utils.js"
import { OrderController } from "./orderController.js"
import { StripeGateway } from "../payment/stripe.js"
const router = express.Router()

const paymentGw = new StripeGateway()
const orderController = new OrderController(paymentGw)

router.post("/", authenticate, asyncWrapper(orderController.create))

export default router