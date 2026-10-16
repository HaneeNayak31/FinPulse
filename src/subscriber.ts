import { subscriber } from "./redis";

subscriber.subscribe("market:prices");
subscriber.on("message", (channel, message) => {
  console.log("Channel:", channel);
  console.log("Received message:", message);
});
