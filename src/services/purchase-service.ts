import { Database } from "../database.ts";
import { CustomerModel } from "../model/customer-model.ts";
import { PurchaseModel, PurchaseStatus } from "../model/purchase-model.ts";
import { PurchaseTicketModel } from "../model/purchase-ticket-model.ts";
import {
  ReservationStatus,
  ReservationTicketModel,
} from "../model/reservation-ticket-model.ts";
import { TicketModel, TicketStatus } from "../model/ticket-model.ts";
import { PaymentService } from "./payment-service.ts";

export class PurchaseService {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  async create(data: {
    customerId: number;
    ticketIds: number[];
    cardToken: string;
  }): Promise<number> {
    const customer = await CustomerModel.findById(data.customerId, {
      user: true,
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const tikects = await TicketModel.findAll({
      where: { ids: data.ticketIds },
    });

    if (tikects.length !== data.ticketIds.length) {
      throw new Error("Some tickets not found");
    }

    if (tikects.some((ticket) => ticket.status !== TicketStatus.AVAILABLE)) {
      throw new Error("Some tickets are not available");
    }

    const amount = tikects.reduce((sum, ticket) => sum + ticket.price, 0);

    const db = Database.getInstance();
    const connection = await db.getConnection();

    let purchase: PurchaseModel;
    try {
      await connection.beginTransaction();

      purchase = await PurchaseModel.create(
        {
          customer_id: data.customerId,
          total_amount: amount,
          status: PurchaseStatus.PENDING,
        },
        { connection },
      );

      await this.associateTicketsWithPurchase(
        purchase.id,
        data.ticketIds,
        connection,
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    try {
      await connection.beginTransaction();
      purchase.status = PurchaseStatus.PAID;
      await purchase.update({ connection });

      for (const ticket of tikects) {
        ticket.status = TicketStatus.SOLD;
        await ticket.update({ connection });
      }

      await ReservationTicketModel.create(
        {
          customer_id: data.customerId,
          ticket_id: data.ticketIds[0],
          status: ReservationStatus.RESERVED,
        },
        { connection },
      );

      await this.paymentService.processPayment(
        {
          name: customer.user.name,
          email: customer.user.email,
          address: customer.address,
          phone: customer.phone,
        },
        purchase.total_amount,
        data.cardToken,
      );

      await connection.commit();

      return purchase.id;
    } catch (error) {
      await connection.rollback();
      purchase.status = PurchaseStatus.ERROR;
      await purchase.update({ connection });
      throw error;
    } finally {
      connection.release();
    }
  }

  private async associateTicketsWithPurchase(
    purchaseId: number,
    ticketIds: number[],
    connection: any,
  ): Promise<void> {
    if (ticketIds.length === 0) {
      return;
    }

    const purchaseTickets = ticketIds.map((ticketId) => ({
      purchase_id: purchaseId,
      ticket_id: ticketId,
    }));

    await PurchaseTicketModel.createMany(purchaseTickets, { connection });
  }

  async findById(id: number): Promise<PurchaseModel | null> {
    return PurchaseModel.findById(id);
  }

  async findByCustomerId(customerId: number): Promise<any[]> {
    const db = Database.getInstance();

    const [rows] = await db.execute<any[]>(
      `SELECT 
         p.id as purchase_id,
         p.purchase_date,
         p.total_amount,
         p.status as purchase_status,
         t.id as ticket_id,
         t.location as ticket_location,
         t.price as ticket_price,
         t.status as ticket_status,
         e.id as event_id,
         e.name as event_name,
         e.description as event_description,
         e.date as event_date,
         e.location as event_location
       FROM purchases p
       JOIN purchase_tickets pt ON pt.purchase_id = p.id
       JOIN tickets t ON t.id = pt.ticket_id
       JOIN events e ON e.id = t.event_id
       WHERE p.customer_id = ?
       ORDER BY p.purchase_date DESC`,
      [customerId]
    );

    // Agrupar tickets por compra
    const purchasesMap = new Map();

    rows.forEach((row: any) => {
      if (!purchasesMap.has(row.purchase_id)) {
        purchasesMap.set(row.purchase_id, {
          id: row.purchase_id,
          purchase_date: row.purchase_date,
          total_amount: parseFloat(row.total_amount),
          status: row.purchase_status,
          tickets: []
        });
      }

      purchasesMap.get(row.purchase_id).tickets.push({
        id: row.ticket_id,
        location: row.ticket_location,
        price: parseFloat(row.ticket_price),
        status: row.ticket_status,
        event: {
          id: row.event_id,
          name: row.event_name,
          description: row.event_description,
          date: row.event_date,
          location: row.event_location
        }
      });
    });

    return Array.from(purchasesMap.values());
  }
}
