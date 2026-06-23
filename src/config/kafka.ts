import { Consumer, EachMessagePayload, Kafka } from "kafkajs"
import { MessageBroker } from "../types/broker.js";
import { handleProductUpdate } from "../productCache/productUpdateHandler.js";
import { handleToppingUpdate } from "../toppingCache/toppingUpdateHandler.js";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer

    constructor(clientId: string, brokers: string[]){
        const kafka  = new Kafka({
            clientId,
            brokers
        })

        this.consumer = kafka.consumer({
            groupId: clientId
        })
    }
        
    /**
     *  Method to connect the consumer
     */
    async connectConsumer(){
        await this.consumer.connect()
    }

    /**
     * Disconnect the consumer 
     */
    async disconnectConsumer(){
        await this.consumer.disconnect()
    }

    async consumeMessage(topics: string[], fromBeginning: boolean = false){
        
        await this.consumer.subscribe({
            topics,
            fromBeginning
        })
        

        await this.consumer.run({
            eachMessage: async({topic, partition, message}: EachMessagePayload) => {
                // Just logging out the values for dev terminal
                console.log({
                    value: message.value.toString(),
                    topic,
                    partition
                });
                switch(topic) {
                    case "product":
                        await handleProductUpdate(message.value.toString())
                        return
                    case "topping":
                        await handleToppingUpdate(message.value.toString())
                        return
                    default:
                        console.log("Doing nothing");
                }                
            }
        })
    }
}