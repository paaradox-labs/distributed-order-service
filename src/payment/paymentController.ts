import { Request, Response } from "express"
import { PaymentGW } from "./paymentTypes.js"
import orderModel from "../order/orderModel.js";
import { PaymentStatus } from "../order/orderTypes.js";
import { MessageBroker } from "../types/broker.js";

export class PaymentController {

    constructor(private paymentGw: PaymentGW, private broker: MessageBroker){}

     handleWebhook = async(req: Request, res: Response) => {
        const webhookBody = req.body;

        if(webhookBody.type  === "checkout.session.completed"){
            const verifiedSession = await this.paymentGw.getSession(webhookBody.data.object.id)
            console.log(`Verified Session: ${JSON.stringify(verifiedSession)}`);

            const isPaymentSuccess = verifiedSession.paymentStatus === "paid"

            const updatedOrder = await orderModel.findOneAndUpdate(
            {
                _id: verifiedSession.metadata.orderId
            },
            {
                paymentStatus: isPaymentSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
            },
            {
                new: true
            }
        )
        console.log(updatedOrder);

        // todo: Need to think about broker message failure.
        await this.broker.sendMessage("order", JSON.stringify(updatedOrder))
    }        

        return res.json({
            success: true
        })
    }       
}