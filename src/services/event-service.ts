import { EventModel } from "../model/event-model.ts";

export class EventService {
  async create(data: {
    name: string;
    description: string | null;
    date: Date;
    location: string;
    partnerId: number;
  }) {
    const { name, description, date, location, partnerId } = data;

    const event = await EventModel.create({
      name,
      description,
      date,
      location,
      partner_id: partnerId,
    });

    return {
      id: event.id,
      name,
      description,
      date,
      location,
      created_at: event.created_at,
      partner_id: event.partner_id,
    };
  }

  async findAll(filters?: { partnerId?: number; name?: string; date?: string; location?: string }) {
    const where: any = {};
    
    if (filters) {
      if (filters.partnerId) where.partner_id = filters.partnerId;
      if (filters.name) where.name = filters.name;
      if (filters.date) where.date = filters.date;
      if (filters.location) where.location = filters.location;
    }

    return await EventModel.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  async findById(eventId: number) {
    return await EventModel.findById(eventId);
  }
}
