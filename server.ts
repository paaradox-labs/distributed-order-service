import app from "./src/app.js";
import config from "config";
import logger from "./src/config/logger.js";
import connectDB from "./src/config/db.js";
import { MessageBroker } from "./src/types/broker.js";
import { createMessageBroker } from "./src/common/factories/brokerFactory.js";

const startServer = async () => {
  const PORT = config.get("server.port") || 5503;

  let broker: MessageBroker | null = null

  try {
    await connectDB();
    broker = createMessageBroker();
    await broker.connectConsumer()
    await broker.consumeMessage(["product", "topping"], false)


    app
      .listen(PORT, () => console.log(`Listening on port ${PORT}`))
      .on("error", (err) => {
        console.log("err", err.message);
        process.exit(1);
      });
  } catch (err) {
    logger.error("Error happened: ", err.message);
    if(broker){
      await broker.disconnectConsumer()
    }
    process.exit(1);
  }
};

void startServer();
