import express from "express"
import authenticate from "../common/middleware/authenticate.js"
import { asyncWrapper } from "../utils.js"
import { CouponController } from "./couponController.js"


const router = express.Router()
const couponController = new CouponController()
router.post("/", authenticate, asyncWrapper(couponController.create))

export default router;