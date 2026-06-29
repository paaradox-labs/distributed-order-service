import express from "express"
import { asyncWrapper } from "../utils.js";
import { PaymentController } from "./paymentController.js";
import { StripeGateway } from "./stripe.js";

const router = express.Router()

// todo: move this instanciation to a Factory 
const paymentGw = new StripeGateway()
const paymentController = new PaymentController(paymentGw)

router.post("/webhook", asyncWrapper(paymentController.handleWebhook))

export default router;