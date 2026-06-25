
import { Request, Response } from "express"
import { CartItem, ProductPricingCache, Topping, ToppingPriceCache } from "../types/index.js"
import productCacheModel from "../productCache/productCacheModel.js"
import toppingCacheModel from "../toppingCache/toppingCacheModel.js"
import couponModel from "../coupon/couponModel.js"
import orderModel from "./orderModel.js"
import { OrderStatus, PaymentStatus } from "./orderTypes.js"

export class OrderController {
    create = async (req: Request, res: Response) => {
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
        const DELIVERY_CHARGES = 100
        
        const finalTotal = Math.round(priceAfterDiscount + taxes + DELIVERY_CHARGES)

        // create an order
        
    const newOrder = await orderModel.create({
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
    });

    return res.json({ newOrder: newOrder });


    }

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