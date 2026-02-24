import express from "express";
import type { Request, Response } from "express";
import { CustomerService } from "../services/customer-service.ts";
import { PaymentService } from "../services/payment-service.ts";
import { PurchaseService } from "../services/purchase-service.ts";

export const purchaseRouter = express.Router();

purchaseRouter.post("/", async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: "Only customers can make purchases" });
    }

    const customerService = new CustomerService();
    const customer = await customerService.findByUserId(req.user.id);

    if (!customer) {
        return res.status(400).json({ error: "Customer profile not found" });
    }

    const { ticket_ids, card_token } = req.body;

    const paymentService = new PaymentService();
    const purchaseService = new PurchaseService(paymentService);
    const newPurchaseId = await purchaseService.create({
        customerId: customer.id,
        ticketIds: ticket_ids,
        cardToken: card_token,
    });

    const purchase = await purchaseService.findById(newPurchaseId);

    return res.status(201).json(purchase);
});

purchaseRouter.get("/", async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: "Only customers can view purchases" });
    }

    try {
        const customerService = new CustomerService();
        const customer = await customerService.findByUserId(req.user.id);

        if (!customer) {
            return res.status(403).json({ error: "Customer profile not found" });
        }

        const paymentService = new PaymentService();
        const purchaseService = new PurchaseService(paymentService);
        const purchases = await purchaseService.findByCustomerId(customer.id);

        return res.status(200).json(purchases);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
});