import { Request, Response } from "express"
import { PaymentGW } from "./paymentTypes.js"
import orderModel from "../order/orderModel.js";
import { PaymentStatus } from "../order/orderTypes.js";

export class PaymentController {

    constructor(private paymentGw: PaymentGW){

    }

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
                returnDocument: "after"
            }
        )
        console.log(updatedOrder);

        // todo: Send Update to Kafka Broker
    }        

        return res.json({
            success: true
        })
    }       
}