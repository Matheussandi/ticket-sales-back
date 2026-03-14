import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { Database } from "../database.ts";

export const TicketStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  SOLD: "sold",
} as const;

export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export class TicketModel {
  id: number;
  location: string;
  event_id: number;
  price: number;
  status: string;
  created_at: Date;

  constructor(data: Partial<TicketModel> = {}) {
    this.fill(data);
  }

  static async create(data: {
    location: string;
    event_id: number;
    price: number;
    status?: TicketStatus;
  }): Promise<TicketModel> {
    const db = Database.getInstance();

    const created_at = new Date();
    const status = data.status ?? TicketStatus.AVAILABLE;

    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO tickets (location, event_id, price, status, created_at) VALUES (?, ?, ?, ?, ?)",
      [data.location, data.event_id, data.price, status, created_at],
    );

    const ticket = new TicketModel({
      ...data,
      id: result.insertId,
      created_at,
    });

    return ticket;
  }

  static async createMany(
    data: {
      location: string;
      event_id: number;
      price: number;
      status?: TicketStatus;
    }[],
  ): Promise<TicketModel[]> {
    const db = Database.getInstance();

    const created_at = new Date();

    const values = Array(data.length).fill("(?, ?, ?, ?, ?)").join(", ");
    const params = data.reduce<(string | number | Date)[]>((acc, ticket) => {
      acc.push(
        ticket.location,
        ticket.event_id,
        ticket.price,
        ticket.status ?? TicketStatus.AVAILABLE,
        created_at,
      );
      return acc;
    }, []);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO tickets (location, event_id, price, status, created_at) VALUES ${values}`,
      params,
    );

    const tickets: TicketModel[] = [];
    for (let i = 0; i < data.length; i++) {
      tickets.push(
        new TicketModel({
          id: result.insertId + i,
          location: data[i].location,
          event_id: data[i].event_id,
          price: data[i].price,
          status: data[i].status ?? TicketStatus.AVAILABLE,
          created_at,
        }),
      );
    }

    return tickets;
  }

  static async findById(id: number): Promise<TicketModel | null> {
    const db = Database.getInstance();
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM tickets WHERE id = ?",
      [id],
    );
    return rows.length ? new TicketModel(rows[0] as TicketModel) : null;
  }

  static async findAll(
    filter?: {
      where?: { event_id?: number; ids?: number[] };
    },
    options?: { connection?: PoolConnection },
  ): Promise<TicketModel[]> {
    const db = options?.connection ?? Database.getInstance();
    let query = "SELECT * FROM tickets";
    const params = [];

    if (filter && filter.where) {
      const where = [];
      if (filter.where.event_id) {
        where.push("event_id = ?");
        params.push(filter.where.event_id);
      }
      if (filter.where.ids) {
        where.push(`id IN (${filter.where.ids.map(() => "?").join(", ")})`);
        params.push(...filter.where.ids);
      }
      if (where.length > 0) {
        query += " WHERE " + where.join(" AND ");
      }
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    return rows.map((row) => new TicketModel(row as TicketModel));
  }

  async update(options?: { connection?: PoolConnection }): Promise<void> {
    const db = options?.connection ?? Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE tickets SET location = ?, event_id = ?, price = ?, status = ? WHERE id = ?",
      [this.location, this.event_id, this.price, this.status, this.id],
    );
    if (result.affectedRows === 0) {
      throw new Error("Ticket not found");
    }
  }

  async delete(): Promise<void> {
    const db = Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM tickets WHERE id = ?",
      [this.id],
    );
    if (result.affectedRows === 0) {
      throw new Error("Ticket not found");
    }
  }

  fill(data: Partial<TicketModel>): void {
    if (data.id !== undefined) this.id = data.id;
    if (data.location !== undefined) this.location = data.location;
    if (data.event_id !== undefined) this.event_id = data.event_id;
    if (data.price !== undefined) this.price = Number(data.price);
    if (data.status !== undefined) this.status = data.status;
    if (data.created_at !== undefined) this.created_at = data.created_at;
  }
}
