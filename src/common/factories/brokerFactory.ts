import { KafkaBroker } from "../../config/kafka.js";
import { MessageBroker } from "../../types/broker.js";
import config from "config"

let broker: MessageBroker | null = null

export const createMessageBroker = ():MessageBroker => {
    console.log("connecting to kafka broker...");
    // singleton
    if(!broker){
        broker = new KafkaBroker("order-service", [config.get("kafka.broker")])
    }

    return broker

}