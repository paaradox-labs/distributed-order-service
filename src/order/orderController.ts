
import { NextFunction, Request, Response } from "express"
import { Request as AuthRequest} from "express-jwt"
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types/index.js"
import productCacheModel from "../productCache/productCacheModel.js"
import toppingCacheModel from "../toppingCache/toppingCacheModel.js"
import couponModel from "../coupon/couponModel.js"
import orderModel from "./orderModel.js"
import { OrderStatus, PaymentMode, PaymentStatus } from "./orderTypes.js"
import idempotencyModel from "../idempotency/idempotencyModel.js"
import createHttpError from "http-errors"
import mongoose from "mongoose"
import { PaymentGW } from "../payment/paymentTypes.js"
import { MessageBroker } from "../types/broker.js"
import customerModel from "../customer/customerModel.js"

export class OrderController {
    constructor (private paymentGw: PaymentGW, private broker: MessageBroker){}
    create = async (req: Request, res: Response, next: NextFunction) => {
    const {
      cart,
      couponCode,
      tenantId,
      paymentMode,
      customerId,
      comment,
      address,
    } = req.body;
        // todo: validate request data
        const totalPrice = await this.calculateTotal(cart)

        let discountPercentage = 0

        if(couponCode){
            discountPercentage = await this.getDiscountPercentage(couponCode, tenantId)
        }

        const discountAmount = Math.round((totalPrice * discountPercentage) / 100)

        const priceAfterDiscount = totalPrice - discountAmount

        // todo: store in db for each tenant based on their respective products 
        const TAXES_PERCENT = 18;
        
        const taxes = Math.round((priceAfterDiscount * TAXES_PERCENT) / 100)
        
        // store in DB for each tenant or calculate based on business logics
        const DELIVERY_CHARGES = 20
        
        const finalTotal = Math.round(priceAfterDiscount + taxes + DELIVERY_CHARGES)
        
        const idempotencyKey = req.headers["idempotency-key"] as string

        const idempotency = await idempotencyModel.findOne({
            key: idempotencyKey
        })

        let newOrder = idempotency ? [idempotency.response] : [];

        if(!idempotency){
            const session = await mongoose.startSession();
            await session.startTransaction();
            
            try {
        newOrder = await orderModel.create(
          [
            {
              cart,
              address,
              comment,
              customerId,
              deliveryCharges: DELIVERY_CHARGES,
              discount: discountAmount,
              taxes,
              tenantId,
              total: finalTotal,
              paymentMode,
              orderStatus: OrderStatus.RECEIVED,
              paymentStatus: PaymentStatus.PENDING,
            },
          ],
          { session },
        );

        await idempotencyModel.create(
          [{ key: idempotencyKey, response: newOrder[0] }],
          { session },
        );

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        await session.endSession();

        return next(createHttpError(500, err.message));
      } finally {
        await session.endSession();
      }
    }

    // Payment flow here...
    // todo: Error handling....
    // todo: Add logging...

    if (paymentMode === PaymentMode.CARD){
        const session = await this.paymentGw.createSession({
        amount: finalTotal,
        orderId: newOrder[0]._id.toString(),
        tenantId: tenantId,
        currency: "inr",
        idempotencyKey: idempotencyKey,
    })

    await this.broker.sendMessage("order", JSON.stringify(newOrder))
    
    return res.json({ 
        paymentUrl: session.paymentUrl
     });
    }

    await this.broker.sendMessage("order", JSON.stringify(newOrder))

    // todo: Update Order Document -> paymentId -> sessionId
    return res.json({
        paymentUrl: null
    })

}

    getMine = async(req:AuthRequest, res: Response, next: NextFunction) => {
        const userId = req.auth.sub

        if(!userId){
            return next(createHttpError(400, "No userId found."))
        }

        // todo: Add error handling 
        const customer = await customerModel.findOne({userId})

        if(!customer){
            return next(createHttpError(400, "No customer found"))
        }

        // todo: implement pagination
        const orders = await orderModel.find({
            customerId: customer._id
        },{
            cart: 0
        })

        return res.json(orders)
    }

    getSingle = async(req: AuthRequest, res: Response, next: NextFunction ) => {
        const orderId = req.params.orderId
        const {sub: userId, role, tenant: tenantId} = req.auth;

        const fields = req.query.fields ? req.query.fields.toString().split(",") : []

        const projection = fields.reduce((acc, field) => {
            acc[field] = 1;
            return acc
        },{})

        const order = await orderModel.findOne({
            _id: orderId
        }, projection)

        if(!order){
            return next(createHttpError(400, "Order does not exists."))
        }

        // Which roles can access this endpoint: Admins, Manager (for their own restaurant), customr (for their own order only)
        const myRestaurantOrder = order.tenantId === tenantId
        
        if(role === "admin"){
            return res.json(order)
        }
        
        if(role === "manager" && myRestaurantOrder){
            return res.json(order)
        }

        if(role === "customer"){
            const customer = await customerModel.findOne({userId})

            if(!customer){
                return next(createHttpError(400, "No customer found"))
            }

            if(order.customerId.toString() === customer._id.toString()){
                return res.json(order)
            }
        }

        return next(createHttpError(403, "Operation not permitted"))
    }   

    

    // create an order
    private calculateTotal = async (cart: CartItem[]) => {
        const productIds = cart.map(item => item._id)

        // todo: proper error handling...
        const productPricings = await productCacheModel.find({
            productId: {
                $in: productIds
            }
        })

        // todo: What will happen if product is not in cache
        // 1. call catalog service for the data
        // 2. get data from client. -> bad idea because there can be bad actord modifying the prices. 

        const cartToppingIds = cart.reduce((acc, item) => {
            return [
                ...acc,
                ...item.chosenConfiguration.selectedToppings.map((topping) => topping.id)
            ]
        },[])

        // todo: What will happen if topping is not in cache
        // 1. call catalog service for the data
        // 2. get data from client. -> bad idea because there can be bad actord modifying the prices. 
        const toppingPricings  = await toppingCacheModel.find({
            toppingId: {
                $in: cartToppingIds
            }
        })

        const totalPrice = cart.reduce((acc,curr) => {
            const cachedProductPrice = productPricings.find((product) => product.productId === curr._id)
            return (
                acc + curr.qty * this.getItemTotal(curr, cachedProductPrice, toppingPricings)
            )
        },0)

        return totalPrice
    }   

    private getItemTotal = (item: CartItem, cachedProductPrice: ProductPricingCache, toppingsPricings: ToppingPriceCache[]) => {
        
        const toppingsTotal = item.chosenConfiguration.selectedToppings.reduce((acc, curr) => {
            return acc + this.getCurrentToppingPrice(curr, toppingsPricings)
        },0)

        const productTotal = Object.entries(item.chosenConfiguration.priceConfiguration).reduce((acc, [key,value]) => {
            const price = cachedProductPrice.priceConfiguration[key].availableOptions[value];
            return acc + price
        },0)

        return productTotal + toppingsTotal
    }

    private getCurrentToppingPrice = (topping: Topping, toppingPricings: ToppingPriceCache[]) => {
        const currentTopping = toppingPricings.find((current) => topping.id === current.toppingId)

        if(!currentTopping){
            // todo: Make sure the item is in the cache or esle maybe call catalog service for the data.
            return topping.price
        }

        return currentTopping.price
    }

    private getDiscountPercentage = async (couponCode: string, tenantId: number ) => {
        const code = await couponModel.findOne({
            code: couponCode,  
            tenantId: tenantId
        })

        if(!code){
            return 0
        }

        const currentDate = new Date()

        const couponDate = new Date(code.validUpto);

        if(currentDate <= couponDate){
            return code.discount;
        }

        return 0
    }
}