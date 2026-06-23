import { ProductMessage } from "../types/index.js"
import productCacheModel from "./productCacheModel.js"

export const handleProductUpdate = async(value: string) => {
    // todo: trycatch the JSON Parse as there can be a chance of getting error and system crashing.
    const product: ProductMessage = JSON.parse(value)

    return await productCacheModel.updateOne({
        productId: product.id,
    },
    {
        $set:{
            priceConfiguration: product.priceConfiguration
        }
    },{
        upsert: true
    })
}