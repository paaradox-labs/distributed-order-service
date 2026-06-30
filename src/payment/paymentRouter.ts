import express from "express"
import { asyncWrapper } from "../utils.js";
import { PaymentController } from "./paymentController.js";
import { StripeGateway } from "./stripe.js";
import { createMessageBroker } from "../common/factories/brokerFactory.js";

const router = express.Router()

// todo: move this instanciation to a Factory 
const paymentGw = new StripeGateway()
const broker = createMessageBroker()
const paymentController = new PaymentController(paymentGw, broker)

router.post("/webhook", asyncWrapper(paymentController.handleWebhook))

export default router;