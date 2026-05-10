import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const razorpayOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().nonempty(),
  receipt: z.string().nonempty(),
  notes: z.object({
    plan: z.string().nonempty(),
    business_name: z.string().nonempty(),
  }),
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(razorpayOrderSchema)
  .handler(async ({ data }) => {
    const input = data;
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.",
      );
    }

    if (!input.amount || typeof input.amount !== "number" || input.amount <= 0) {
      throw new Error("Invalid Razorpay order amount.");
    }

    const body = {
      amount: input.amount,
      currency: input.currency || process.env.RAZORPAY_CURRENCY || "INR",
      receipt: input.receipt || `fixi-order-${Date.now()}`,
      payment_capture: 1,
      notes: input.notes,
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${response.status} ${errorText}`);
    }

    const order = await response.json();
    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      receipt: order.receipt,
    };
  },
);
