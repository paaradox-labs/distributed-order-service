import express from "express";
import { asyncWrapper } from "../utils.js";
import { CustomerController } from "./customerController.js";
import authenticate from "../common/middleware/authenticate.js";

const router = express.Router()

const customerController = new CustomerController()
router.get("/", authenticate, asyncWrapper(customerController.getCustomer))

router.patch("/addresses/:id", authenticate, asyncWrapper(customerController.addAddress))


export default router