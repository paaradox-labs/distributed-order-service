import { ToppingMessage } from "../types/index.js";
import toppingCacheModel from "./toppingCacheModel.js";


export const handleToppingUpdate = async (value: string) => {
  // todo: parse this JSON parse in trycatch or if error can crash the thing. 
  const topping: ToppingMessage = JSON.parse(value);

  return await toppingCacheModel.updateOne(
    {
      toppingId: topping.id,
    },
    {
      $set: {
        price: topping.price,
        tenantId: topping.tenantId,
      },
    },
    { upsert: true },
  );
};