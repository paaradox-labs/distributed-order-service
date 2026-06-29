import Stripe from "stripe";
import { PaymentGW, PaymentOptions } from "./paymentTypes.js";
import config from "config"

export class StripeGateway implements PaymentGW {
    private stripe: Stripe

    constructor() {
        this.stripe = new Stripe(config.get("stripe.secretKey"))
    }

    async createSession(options: PaymentOptions) {
        const session = await this.stripe.checkout.sessions.create({
            metadata:{
                ordeId: options.orderId,
            },
            line_items:[
                {
                    price_data: {
                        unit_amount: options.amount * 100,
                        product_data:{
                            name: "Online Pizza Order",
                            description: "Total Amount to be paid",
                            images: [
                                "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1b/06/1c/2f/we-have-many-different.jpg?w=1400&h=800&s=1"
                            ]
                        },
                        currency: options.currency || "inr",
                    },
                    quantity: 1
                }
            ],
            mode: "payment", 
            success_url: `${config.get("frontend.clientUI")}/payment?success=true&orderId=${options.orderId}`,
            cancel_url: `${config.get("frontend.clientUI")}/payment?success=false&orderId=${options.orderId}`  
        },
    {
        idempotencyKey: options.idempotencyKey
    }
    )
    return{
        id: session.id,
        paymentUrl: session.url,
        paymentStatus: session.payment_status,
    };
    }

    async getSession() {
        return null
    }
}