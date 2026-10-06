import type { BusinessProfile } from "../types";

// Pre-built "customer" businesses used to populate the Live Demo call
// scenarios and seeded appointment/call history data. These represent other
// SMB customers already using SMB AI Receptionist, distinct from the business the
// presenter sets up in the Setup wizard.

export const SAMPLE_BUSINESSES: Record<string, BusinessProfile> = {
  "rivera-plumbing": {
    businessName: "Rivera Plumbing & Drain",
    website: "riveraplumbinganddrain.com",
    category: "home-services",
    phone: "(555) 412-8890",
    address: "118 Birchwood Ave, Millbrook",
    about:
      "Family-owned plumbing company serving Millbrook and the surrounding area for 22 years. Licensed, insured, and available for emergency calls.",
    services: [
      "Drain cleaning",
      "Water heater repair & install",
      "Leak detection",
      "Emergency after-hours service",
      "Fixture installation",
    ],
    hours: [
      { day: "Mon", open: "07:30", close: "17:00", closed: false },
      { day: "Tue", open: "07:30", close: "17:00", closed: false },
      { day: "Wed", open: "07:30", close: "17:00", closed: false },
      { day: "Thu", open: "07:30", close: "17:00", closed: false },
      { day: "Fri", open: "07:30", close: "17:00", closed: false },
      { day: "Sat", open: "08:00", close: "12:00", closed: false },
      { day: "Sun", open: "", close: "", closed: true },
    ],
    faqs: [
      { question: "Do you charge for emergency calls?", answer: "Yes, a $85 after-hours dispatch fee applies, waived if you become a maintenance plan member." },
      { question: "Do you offer free estimates?", answer: "Yes, estimates are free for jobs quoted in person." },
    ],
    pricing: [
      { service: "Drain cleaning", price: "$150 flat rate" },
      { service: "Water heater install", price: "Starting at $1,200" },
      { service: "Emergency after-hours dispatch", price: "$85 fee" },
    ],
    scrapedAt: "2026-09-02T14:05:00Z",
  },
  "bright-smiles-dental": {
    businessName: "Bright Smiles Family Dental",
    website: "brightsmilesfamilydental.com",
    category: "healthcare",
    phone: "(555) 288-3310",
    address: "2200 Oakmont Blvd, Suite 4, Millbrook",
    about:
      "A family dental practice offering general and cosmetic dentistry, with evening hours for working families.",
    services: [
      "Routine cleanings & checkups",
      "Teeth whitening",
      "Invisalign consultations",
      "Emergency tooth pain visits",
      "Pediatric dentistry",
    ],
    hours: [
      { day: "Mon", open: "08:00", close: "18:00", closed: false },
      { day: "Tue", open: "08:00", close: "18:00", closed: false },
      { day: "Wed", open: "08:00", close: "18:00", closed: false },
      { day: "Thu", open: "08:00", close: "18:00", closed: false },
      { day: "Fri", open: "08:00", close: "14:00", closed: false },
      { day: "Sat", open: "", close: "", closed: true },
      { day: "Sun", open: "", close: "", closed: true },
    ],
    faqs: [
      { question: "How much is teeth whitening?", answer: "In-office whitening starts at $249; a take-home tray kit is $149." },
      { question: "Do you accept new patients?", answer: "Yes, we're currently accepting new patients of all ages." },
      { question: "Do you take my insurance?", answer: "We're in-network with most major PPO plans — our team confirms coverage before your visit." },
    ],
    pricing: [
      { service: "Routine cleaning & checkup", price: "$120" },
      { service: "In-office teeth whitening", price: "$249" },
      { service: "Take-home whitening kit", price: "$149" },
    ],
    scrapedAt: "2026-09-10T09:30:00Z",
  },
  "luxe-cuts-salon": {
    businessName: "Luxe Cuts Salon & Spa",
    website: "luxecutssalon.com",
    category: "personal-care",
    phone: "(555) 671-2244",
    address: "48 Harborview St, Millbrook",
    about:
      "Full-service hair salon and spa specializing in color, cuts, and bridal styling, led by a team of six stylists.",
    services: ["Haircuts & styling", "Color & highlights", "Keratin treatments", "Bridal packages", "Manicure & pedicure"],
    hours: [
      { day: "Mon", open: "", close: "", closed: true },
      { day: "Tue", open: "09:00", close: "19:00", closed: false },
      { day: "Wed", open: "09:00", close: "19:00", closed: false },
      { day: "Thu", open: "09:00", close: "19:00", closed: false },
      { day: "Fri", open: "09:00", close: "19:00", closed: false },
      { day: "Sat", open: "08:30", close: "16:00", closed: false },
      { day: "Sun", open: "10:00", close: "15:00", closed: false },
    ],
    faqs: [
      { question: "How do I reschedule?", answer: "Just let us know your name and current appointment time, and we'll find a new slot." },
      { question: "Do you take walk-ins?", answer: "We prioritize appointments, but walk-ins are welcome if a stylist is free." },
    ],
    pricing: [
      { service: "Haircut & style", price: "Starting at $55" },
      { service: "Color & highlights", price: "Starting at $120" },
      { service: "Bridal package", price: "Starting at $350" },
    ],
    scrapedAt: "2026-08-18T11:20:00Z",
  },
  "golden-dragon": {
    businessName: "Golden Dragon Take-Out",
    website: "goldendragontakeout.com",
    category: "food-and-beverage",
    phone: "(555) 903-7765",
    address: "77 Market St, Millbrook",
    about: "Family-run Chinese take-out and delivery, serving Millbrook since 2009.",
    services: ["Take-out", "Delivery (3 mile radius)", "Catering trays for 10+"],
    hours: [
      { day: "Mon", open: "11:00", close: "21:00", closed: false },
      { day: "Tue", open: "11:00", close: "21:00", closed: false },
      { day: "Wed", open: "11:00", close: "21:00", closed: false },
      { day: "Thu", open: "11:00", close: "21:00", closed: false },
      { day: "Fri", open: "11:00", close: "22:00", closed: false },
      { day: "Sat", open: "11:00", close: "22:00", closed: false },
      { day: "Sun", open: "12:00", close: "20:00", closed: false },
    ],
    faqs: [
      { question: "Do you deliver?", answer: "Yes, within a 3 mile radius, minimum order $20." },
      { question: "Are you open on holidays?", answer: "We're closed on Thanksgiving and Christmas Day; open regular hours all other holidays." },
    ],
    pricing: [
      { service: "Catering tray (serves 10+)", price: "Starting at $65" },
      { service: "Delivery minimum order", price: "$20" },
    ],
    scrapedAt: "2026-07-29T16:40:00Z",
  },
};
