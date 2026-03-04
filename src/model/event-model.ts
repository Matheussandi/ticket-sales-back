import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Database } from "../database.ts";

export class EventModel {
  id: number;
  name: string;
  description: string | null;
  date: Date;
  location: string;
  created_at: Date;
  partner_id: number;

  constructor(data: Partial<EventModel> = {}) {
    this.fill(data);
  }

  static async create(data: {
    name: string;
    description?: string;
    date: Date;
    location: string;
    partner_id: number;
  }): Promise<EventModel> {
    const db = Database.getInstance();

    const createdAt = new Date();

    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO events (name, description, date, location, created_at, partner_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        data.name,
        data.description ?? null,
        data.date,
        data.location,
        createdAt,
        data.partner_id,
      ],
    );

    const event = new EventModel({
      ...data,
      id: result.insertId,
      created_at: createdAt,
    });

    return event;
  }

  static async findById(id: number): Promise<EventModel | null> {
    const db = Database.getInstance();
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM events WHERE id = ?",
      [id],
    );
    return rows.length ? new EventModel(rows[0] as EventModel) : null;
  }

  static async findAll(filter?: {
    where?: { id?: number; partner_id?: number; name?: string; date?: string; location?: string };
  }): Promise<EventModel[]> {
    const db = Database.getInstance();
    let query = "SELECT * FROM events";
    const params: any[] = [];
    const conditions: string[] = [];

    if (filter && filter.where) {
      if (filter.where.id) {
        conditions.push("id = ?");
        params.push(filter.where.id);
      }
      if (filter.where.partner_id) {
        conditions.push("partner_id = ?");
        params.push(filter.where.partner_id);
      }
      if (filter.where.name) {
        conditions.push("name LIKE ?");
        params.push(`%${filter.where.name}%`);
      }
      if (filter.where.date) {
        conditions.push("DATE(date) = ?");
        params.push(filter.where.date);
      }
      if (filter.where.location) {
        conditions.push("location LIKE ?");
        params.push(`%${filter.where.location}%`);
      }
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    return rows.map((row) => new EventModel(row as EventModel));
  }

  async update(): Promise<void> {
    const db = Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "UPDATE events SET name = ?, description = ?, date = ?, location = ?, partner_id = ? WHERE id = ?",
      [
        this.name,
        this.description,
        this.date,
        this.location,
        this.partner_id,
        this.id,
      ],
    );
    if (result.affectedRows === 0) {
      throw new Error("Event not found");
    }
  }

  async delete(): Promise<void> {
    const db = Database.getInstance();
    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM events WHERE id = ?",
      [this.id],
    );
    if (result.affectedRows === 0) {
      throw new Error("Event not found");
    }
  }

  fill(data: Partial<EventModel>): void {
    if (data.id !== undefined) this.id = data.id;
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.date !== undefined) this.date = data.date;
    if (data.location !== undefined) this.location = data.location;
    if (data.created_at !== undefined) this.created_at = data.created_at;
    if (data.partner_id !== undefined) this.partner_id = data.partner_id;
  }
}
