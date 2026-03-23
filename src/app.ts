import express from "express";
import cookieParser from "cookie-parser";

import { purchaseRouter } from "./controller/purchase-controller.ts";
import { customerRouter } from "./controller/customer-controller.ts";
import { partnerRouter } from "./controller/partner-controller.ts";
import { eventsRouter } from "./controller/events-controller.ts";
import { ticketRoutes } from "./controller/ticket-contoller.ts";
import { authRouter } from "./controller/auth-controller.ts";
import { profileRouter } from "./controller/profile-controller.ts";

import { corsMiddleware } from "./middlewares/cors-middleware.ts";
import { authMiddleware } from "./middlewares/auth-middleware.ts";

import { Database } from "./database.ts";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware());
app.use(authMiddleware);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/customers", customerRouter);
app.use("/partners", partnerRouter);
app.use("/events", eventsRouter);
app.use("/events", ticketRoutes);
app.use("/purchases", purchaseRouter);

const PORT = process.env.PORT || 3000;

export default app;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});