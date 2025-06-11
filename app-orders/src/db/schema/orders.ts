import { integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers.ts";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "canceled",
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  amount: integer("amount").notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp().defaultNow().notNull(),
});
