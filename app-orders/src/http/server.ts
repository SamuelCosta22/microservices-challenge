import { fastifyCors } from "@fastify/cors";
import { z } from "zod";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import fastify from "fastify";
import { channels } from "../broker/channels/index.ts";
import { db } from "../db/client.ts";
import { schema } from "../db/schema/index.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors, {
  origin: "*",
});

app.get("/health", () => {
  return "OK";
});

app.post(
  "/orders",
  {
    schema: {
      body: z.object({
        amount: z.coerce.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body;
    console.log("Creating an order with amount: ", amount);

    channels.orders.sendToQueue(
      "orders",
      Buffer.from(JSON.stringify({ amount }))
    );

    try {
      await db.insert(schema.orders).values({
        id: crypto.randomUUID(),
        customerId: "dad73f3e-31c4-4f30-8e84-242094f62ddf",
        amount,
        status: "pending",
      });
    } catch (err) {
      console.log(err);
    }

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3000 }).then(() => {
  console.log("[Orders] HTTP Server Running!");
});
