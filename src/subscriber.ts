import { subscriber } from "./redis";
subscriber.subscribe("market:prices");

subscriber.on("message", (channel, message) => {
  try {
    const event = JSON.parse(message);

    console.log("Channel:", channel);
    console.log("Event:", event.event);
    console.log("Symbol:", event.symbol);
    console.log("Price:", event.price);
    console.log("Timestamp:", event.timestamp);
  } catch (error) {
    console.error("Failed to parse Redis message:", error);
  }
});
