import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

import { Database } from "../database.ts";

export const PurchaseStatus = {
  PENDING: "pending",
  PAID: "paid",
  ERROR: "error",
  CANCELED: "canceled",
} as const;

export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];

export class PurchaseModel {
  id: number;
  customer_id: number;
  purchase_date: Date;
  total_amount: number;
  status: PurchaseStatus;

  constructor(data: Partial<PurchaseModel> = {}) {
    this.fill(data);
  }

  static async create(
    data: {
      customer_id: number;
      total_amount: number;
      status?: PurchaseStatus;
    },
    options?: { connection?: PoolConnection },
  ): Promise<PurchaseModel> {
    const db = options?.connection ?? Database.getInstance();

    const purchase_date = new Date();

    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES (?, ?, ?, ?)",
      [data.customer_id, data.total_amount, data.status, purchase_date],
    );

    const purchase = new PurchaseModel({
      ...data,
      id: result.insertId,
      purchase_date,
    });

    return purchase;
  }

  static async createMany(
    purchaseTickets: any[],
    options?: { connection?: PoolConnection },
  ) {
    const db = options?.connection ?? Database.getInstance();

    if (purchaseTickets.length === 0) {
      return;
    }

    const values = purchaseTickets.map((purchase) => [
      purchase.customer_id,
      purchase.total_amount,
      purchase.status,
      purchase.purchase_date,
    ]);

    await db.execute<ResultSetHeader>(
      "INSERT INTO purchases (customer_id, total_amount, status, purchase_date) VALUES ?",
      [values],
    );
  }

  static async findById(id: number): Promise<PurchaseModel | null> {
    const db = Database.getInstance();

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM purchases WHERE id = ?",
      [id],
    );

    return rows.length ? new PurchaseModel(rows[0] as PurchaseModel) : null;
  }

  static async findAll(): Promise<PurchaseModel[]> {
    const db = Database.getInstance();

    const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM purchases");

    return rows.map((row) => new PurchaseModel(row as PurchaseModel));
  }

  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE purchases SET customer_id = ?, total_amount = ?, status = ?, purchase_date = ? WHERE id = ?",
      [
        this.customer_id,
        this.total_amount,
        this.status,
        this.purchase_date,
        this.id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error("Purchase not found");
    }
  }

  async delete(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM purchases WHERE id = ?",
      [this.id],
    );

    if (result.affectedRows === 0) {
      throw new Error("Purchase not found");
    }
  }

  fill(data: Partial<PurchaseModel>) {
    if (data.id !== undefined) this.id = data.id;
    if (data.customer_id !== undefined) this.customer_id = data.customer_id;
    if (data.purchase_date !== undefined) this.purchase_date = data.purchase_date;
    if (data.total_amount !== undefined) this.total_amount = Number(data.total_amount);
    if (data.status !== undefined) this.status = data.status;
  }
}
