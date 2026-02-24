import { Database } from "../database.ts";
import { UserModel } from "../model/user-model.ts";
import { PartnerModel } from "../model/partner-model.ts";

export class PartnerService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    company_name: string;
  }) {
    const { name, email, password, company_name } = data;

    const connection = await Database.getInstance().getConnection();

    try {
      await connection.beginTransaction();

      const user = await UserModel.create(
        {
          name,
          email,
          password,
          role: 'partner',
        },
        { connection },
      );

      const partner = await PartnerModel.create(
        {
          user_id: user.id,
          company_name,
        },
        { connection },
      );

      await connection.commit();

      return {
        id: partner.id,
        name,
        user_id: user.id,
        company_name,
        created_at: partner.created_at,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAll() {
    return PartnerModel.findAll();
  }

  async findByUserId(userId: number) {
    return PartnerModel.findByUserId(userId);
  }

  async getDashboard(partnerId: number) {
    const db = Database.getInstance();
    
    const [rows] = await db.execute<any[]>(
      `SELECT 
         COUNT(DISTINCT e.id) as total_events,
         COUNT(DISTINCT CASE 
           WHEN MONTH(e.created_at) = MONTH(CURRENT_DATE()) 
           AND YEAR(e.created_at) = YEAR(CURRENT_DATE()) 
           THEN e.id 
         END) as events_this_month,
         COUNT(CASE WHEN t.status = 'sold' THEN 1 END) as tickets_sold,
         COALESCE(SUM(CASE WHEN t.status = 'sold' THEN t.price END), 0) as total_revenue
       FROM events e
       LEFT JOIN tickets t ON t.event_id = e.id
       WHERE e.partner_id = ?`,
      [partnerId]
    );

    return {
      totalEvents: rows[0].total_events,
      eventsThisMonth: rows[0].events_this_month,
      ticketsSold: rows[0].tickets_sold,
      totalRevenue: parseFloat(rows[0].total_revenue)
    };
  }
}
