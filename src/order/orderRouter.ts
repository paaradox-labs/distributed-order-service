
import express from "express"
import authenticate from "../common/middleware/authenticate.js"
import { asyncWrapper } from "../utils.js"
import { OrderController } from "./orderController.js"
import { StripeGateway } from "../payment/stripe.js"
import { createMessageBroker } from "../common/factories/brokerFactory.js"
const router = express.Router()

const paymentGw = new StripeGateway()

const broker = createMessageBroker()

const orderController = new OrderController(paymentGw, broker)

router.post("/", authenticate, asyncWrapper(orderController.create))
router.get("/", authenticate, asyncWrapper(orderController.getAll))
router.get("/mine", authenticate, asyncWrapper(orderController.getMine))
router.get("/:orderId", authenticate, asyncWrapper(orderController.getSingle))

export default router