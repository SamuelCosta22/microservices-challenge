import "@opentelemetry/auto-instrumentations-node/register";
import { trace } from "@opentelemetry/api";

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
import { dispatchOrderCreated } from "../broker/messages/order-created.ts";
import { setTimeout } from "node:timers/promises";
import { tracer } from "../tracer/tracer.ts";

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

    const orderId = crypto.randomUUID();

    await db.insert(schema.orders).values({
      id: orderId,
      customerId: "dad73f3e-31c4-4f30-8e84-242094f62ddf",
      amount,
      status: "pending",
    });

    const span = tracer.startSpan("Eu acho que aqui tá dando erro ó");
    span.setAttribute("teste", "Hello World!");
    await setTimeout(2000);
    span.end();

    trace.getActiveSpan()?.setAttribute("order_id", orderId);

    dispatchOrderCreated({
      orderId,
      amount,
      customer: { id: "dad73f3e-31c4-4f30-8e84-242094f62ddf" },
    });

    return reply.status(201).send();
  }
);

app.listen({ host: "0.0.0.0", port: 3000 }).then(() => {
  console.log("[Orders] HTTP Server Running!");
});
