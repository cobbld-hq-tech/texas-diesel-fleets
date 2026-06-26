// Static content for the Texas Diesel Fleets booking page, lifted from the
// Claude Design prototype's renderVals().

export type PaletteName =
  | "Steel & Barn Red"
  | "Midnight Hi-Vis"
  | "Graphite & Safety Orange"
  | "Forest & Brass"
  | "Copper & Slate"
  | "Inferno"
  | "Arctic"
  | "Mojave";

export const PALETTE_ATTR: Record<PaletteName, string> = {
  "Steel & Barn Red": "steel",
  "Midnight Hi-Vis": "midnight",
  "Graphite & Safety Orange": "graphite",
  "Forest & Brass": "forest",
  "Copper & Slate": "copper",
  Inferno: "inferno",
  Arctic: "arctic",
  Mojave: "mojave",
};

export const GAUGE_CONFIG = [
  { label: "Locally Owned & Operated", value: 2025, max: 2600, unit: "MIDLAND, TX", suffix: "" },
  { label: "Fast Turnaround Times", value: 12, max: 16, unit: "SERVICE BAYS", suffix: "" },
  { label: "Certified Diesel Technicians", value: 100, max: 112, unit: "ASE CERTIFIED", suffix: "%" },
] as const;

export const GAUGE_IDLE = [
  { rev: "tdf-rev 5.2s ease-in-out 1.3s infinite", vibe: "tdf-vibe 0.13s linear infinite" },
  { rev: "tdf-rev 6.9s ease-in-out 3s infinite", vibe: "tdf-vibe 0.16s linear infinite" },
  { rev: "tdf-rev 4.4s ease-in-out 0.7s infinite", vibe: "tdf-vibe 0.115s linear infinite" },
] as const;

export type SystemKey =
  | "engine"
  | "electrical"
  | "maintenance"
  | "dot"
  | "trans"
  | "exhaust"
  | "driveline";

export const SYSTEMS: Record<
  SystemKey,
  { no: string; label: string; title: string; body: string; svc: string }
> = {
  engine: {
    no: "01",
    label: "Engine & Fuel",
    title: "Engine Diagnostics",
    body: "Hard starts, rough idle, low power, or a check-engine light. We read the live data and find what is actually wrong.",
    svc: "Engine Diagnostics",
  },
  electrical: {
    no: "02",
    label: "Electrical & Charging",
    title: "Electrical & Charging",
    body: "No-starts, dead batteries, alternators, and wiring gremlins. We trace it back to the bad wire and fix it there.",
    svc: "Electrical & Charging",
  },
  maintenance: {
    no: "03",
    label: "Service & Brakes",
    title: "Preventive / Fleet Maintenance",
    body: "Oil, fluids, filters, brakes, and tires on a set schedule. We keep the records so your truck or fleet stays ahead of problems.",
    svc: "Preventive / Fleet Maintenance",
  },
  dot: {
    no: "04",
    label: "Safety & Compliance",
    title: "DOT Inspection",
    body: "Annual DOT and FMCSA inspections, documented so your driver has the paperwork ready roadside.",
    svc: "DOT Inspection",
  },
  trans: {
    no: "05",
    label: "Drivetrain",
    title: "Transmission Service",
    body: "Slipping, hard shifts, leaks, or a shudder under load. We service and rebuild automatics and manuals, plus transfer cases and differentials.",
    svc: "Transmission Service",
  },
  exhaust: {
    no: "06",
    label: "Exhaust / Emissions",
    title: "DPF / Exhaust & Emissions",
    body: "DPF clogs, DEF faults, and emissions codes that put the truck in limp mode. We clean, force a regen, and clear the codes properly.",
    svc: "DPF / Exhaust & Emissions",
  },
  driveline: {
    no: "07",
    label: "Axles & Frame",
    title: "Heavy-Duty Repair",
    body: "Rear axle, differential, driveshaft, suspension, and frame work, all tested under load before it leaves the shop.",
    svc: "Heavy-Duty Repair",
  },
};

export const HOTSPOT_POS: Record<SystemKey, { left: string; top: string }> = {
  engine: { left: "7%", top: "54%" },
  electrical: { left: "17%", top: "34%" },
  maintenance: { left: "11%", top: "78%" },
  dot: { left: "58%", top: "40%" },
  trans: { left: "38%", top: "74%" },
  exhaust: { left: "25%", top: "56%" },
  driveline: { left: "84%", top: "74%" },
};

export const SERVICE_OPTIONS = [
  "Heavy-Duty Repair",
  "Preventive / Fleet Maintenance",
  "Engine Diagnostics",
  "Engine Rebuild",
  "Transmission Service",
  "DPF / Exhaust & Emissions",
  "Electrical & Charging",
  "DOT Inspection",
  "Roadside / Mobile Service",
  "Other",
];

export const CREDS = [
  { num: "2025", label: "Year we opened" },
  { num: "ASE", label: "Certified diesel techs" },
  { num: "LOCAL", label: "Midland owned & run" },
];

export const REVIEWS = [
  {
    tag: "Verified",
    quote:
      "Got two of our trucks back on the road the same day. Straight answer on what was wrong and what it would cost. That’s all I ask from a shop.",
    name: "Dale R.",
    role: "Fleet Manager · Lone Star Logistics",
  },
  {
    tag: "Verified",
    quote:
      "I’ve had shops just clear the codes and send me off. These guys found the bad injector and showed me the part. Fair price, no games.",
    name: "Marisol T.",
    role: "Owner-Operator",
  },
  {
    tag: "Verified",
    quote:
      "They handle DOT inspections for our whole fleet and the paperwork is always right. Easy to get on the schedule, too.",
    name: "Wendell K.",
    role: "Ops Director · Brazos Freight",
  },
];
