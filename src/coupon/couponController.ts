import { NextFunction, Request, Response } from "express"
import couponModel from "./couponModel.js"
import createHttpError from "http-errors"

export class CouponController {
    getAll = async(req: Request, res: Response) => {
        const {perPage, currentPage, q, tenantId} = req.query

        const query: Record<string, unknown> = {}

        if(q) {
            query.title = { $regex: q as string, $options: 'i' }
        }

        if(tenantId) {
            query.tenantId = Number(tenantId)
        }

        const page = Number(currentPage || 1)
        const limit = Number(perPage || 6)
        const skip = (page - 1) * limit

        const [coupons, total] = await Promise.all([
            couponModel.find(query).skip(skip).limit(limit).sort({createdAt: -1}),
            couponModel.countDocuments(query)
        ])

        return res.json({
            currentPage: page,
            perPage: limit,
            total,
            data: coupons
        })
    }

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

    verify = async(req: Request, res: Response, next: NextFunction) => {
        
    const {code, tenantId} = req.body
    // todo : req validation
    // todo: add service layer with deps injection.
    
    const coupon = await couponModel.findOne({
        code, tenantId
    })

    if(!coupon){
        const error = createHttpError(400, "Coupon does not exists")
        return next(error)
        }
    

    const currentDate = new Date();
    const couponDate = new Date(coupon.validUpto)

    if(currentDate <= couponDate){
        return res.json({
            valid: true,
            discount: coupon.discount
        })
    }

    res.json({
        valid: false,
        discount: 0
    })

    }
}

