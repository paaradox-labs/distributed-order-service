import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler.js";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRouter.js"
import couponRouter from "./coupon/couponRouter.js"
import orderRouter from "./order/orderRouter.js"
import paymentRouter from "./payment/paymentRouter.js"
import cors from "cors"
import config from "config"

const app = express();
const ALLOWED_DOMAINS = [config.get("frontend.clientUI"), config.get("frontend.adminUI")]

app.use(cors({
  origin: ALLOWED_DOMAINS as string[]
}))
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use("/customer", customerRouter)
app.use("/coupons", couponRouter)
app.use("/orders", orderRouter)
app.use("/payments", paymentRouter)

app.use(globalErrorHandler);

export default app;
