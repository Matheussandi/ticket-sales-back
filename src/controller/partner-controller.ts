import { Router } from "express";
import { PartnerService } from "../services/partner-service.ts";
import { EventService } from "../services/event-service.ts";

export const partnerRouter = Router();

partnerRouter.get("/", async (req, res) => {
  const partnerService = new PartnerService();
  const partners = await partnerService.findAll();

  res.json(partners);
});

partnerRouter.post("/register", async (req, res) => {
  const { name, email, password, company_name } = req.body;

  const partnerService = new PartnerService();

  const result = await partnerService.register({
    name,
    email,
    password,
    company_name,
  });

  res.status(201).json(result);
});

partnerRouter.post("/events", async (req, res) => {
  const { name, description, date, location } = req.body;

  const userId = req.user!.id;

  if (req.user!.role !== 'partner') {
    return res.status(403).json({ message: "Not authorized" });
  }

  const partnerService = new PartnerService();
  const partner = await partnerService.findByUserId(userId);

  if (!partner) {
    return res.status(403).json({ message: "Partner profile not found" });
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

partnerRouter.get("/events", async (req, res) => {
  const userId = req.user!.id;

  const partnerService = new PartnerService();
  const partner = await partnerService.findByUserId(userId);

  const eventService = new EventService();
  const result = await eventService.findAll(partner?.id);

  res.json(result);
});

partnerRouter.get("/events/:eventId", async (req, res) => {
  const { eventId } = req.params;

  const userId = req.user!.id;

  if (req.user!.role !== 'partner') {
    return res.status(403).json({ message: "Not authorized" });
  }

  const partnerService = new PartnerService();
  const partner = await partnerService.findByUserId(userId);

  if (!partner) {
    return res.status(403).json({ message: "Partner profile not found" });
  }

  const eventService = new EventService();
  const event = await eventService.findById(Number(eventId));

  if (!event || event.partner_id !== partner.id) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.status(200).json(event);
});

partnerRouter.get("/dashboard", async (req, res) => {
  const userId = req.user!.id;

  if (req.user!.role !== 'partner') {
    return res.status(403).json({ message: "Not authorized" });
  }

  try {
    const partnerService = new PartnerService();
    const partner = await partnerService.findByUserId(userId);

    if (!partner) {
      return res.status(403).json({ message: "Partner profile not found" });
    }

    const dashboard = await partnerService.getDashboard(partner.id);
    res.status(200).json(dashboard);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
