import { Router } from "express";

import { EventService } from "../services/event-service.ts";
import { PartnerService } from "../services/partner-service.ts";

export const eventsRouter = Router();

eventsRouter.post("/", async (req, res) => {
  const { name, description, date, location } = req.body;

  if (req.user!.role !== 'partner') {
    return res.status(403).json({ error: "Only partners can create events" });
  }

  const partnerService = new PartnerService();
  const partner = await partnerService.findByUserId(req.user!.id);

  if (!partner) {
    return res.status(403).json({ error: "Partner profile not found" });
  }

  const eventService = new EventService();

  const result = await eventService.create({
    name,
    description,
    date: new Date(date),
    location,
    partnerId: partner.id,
  });

  res.status(201).json(result);
});

eventsRouter.get("/", async (req, res) => {
  const { id, name, date, location } = req.query;
  
  const eventService = new EventService();
  const result = await eventService.findAll({
    id: id ? Number(id) : undefined,
    name: name as string | undefined,
    date: date as string | undefined,
    location: location as string | undefined,
  });
  
  res.status(200).json(result);
});

eventsRouter.get("/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const eventService = new EventService();
  const event = await eventService.findById(Number(eventId));

  if (event) {
    res.status(200).json(event);
  } else {
    res.status(404).json({ error: "Event not found" });
  }
});
