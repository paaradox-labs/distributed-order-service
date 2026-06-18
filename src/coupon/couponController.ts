import { Request, Response } from "express"
import couponModel from "./couponModel.js"

export class CouponController {
    create = async(req: Request, res: Response) => {
        const {title, code, validUpto, discount, tenantId} = req.body
    
    const coupon = await couponModel.create({
      title,
      code,
      discount,
      validUpto,
      tenantId  
    })

    return res.json(coupon)
    }
}