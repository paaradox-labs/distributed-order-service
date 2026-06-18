import { Response } from "express"
import { Request } from "express-jwt"
import customerModel from "./customerModel.js";

export class CustomerController {
    getCustomer = async(req: Request,res: Response) => {
        // todo: add these field to jwt in auth service
        const { sub: userId, firstName, lastName, email } = req.auth;

        // todo: implement service layer
        const customer = await customerModel.findOne({userId})

        if(!customer){
            const newCustomer = await customerModel.create({
                userId,
                firstName,
                lastName,
                email,
                addresses: [],
            })
            // todo: add logging
            return res.json(newCustomer);
        }
        res.json(customer)
    }

    addAddress = async(req: Request, res: Response) => {
        const {sub: userId} = req.auth

        // todo: add service layer
        const customer = await  customerModel.findOneAndUpdate({
            _id: req.params.id,
            userId
        },{
            $push:{
                addresses: {
                    text: req.body.address,
                    // todo: implement this in future.
                    isDefault: false
                }
            }
        },{
            returnDocument: "after"
        })
        // todo: add loggining, 
        return res.json(customer)
    }   
}