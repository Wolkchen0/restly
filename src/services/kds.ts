// ── KDS Simulator — realistic, time-varying kitchen data ──
// Generates dynamic ticket and station data that changes every request,
// simulating a real Toast/Square KDS integration.

interface KDSTicket {
  id: string;
  table: string;
  server: string;
  items: string[];
  timeMinutes: number;
  time: string;
  status: "LATE" | "WARNING" | "ON_TIME" | "FIRED";
  station: string;
  priority: "normal" | "rush" | "vip";
  coursing?: string;
}

interface StationStatus {
  name: string;
  avgTime: number;
  load: number;
  status: "BOTTLENECK" | "HIGH" | "OK" | "IDLE";
  activeTickets: number;
  capacity: number;
}

// ── Menu items by station ──
const MENU_BY_STATION: Record<string, string[]> = {
  Grill: ["Ribeye (MR)", "Ribeye (M)", "Ribeye (MW)", "NY Strip (R)", "NY Strip (M)", "Filet Mignon (MR)", "Wagyu Tenderloin (M)", "Lamb Chops", "Pork Chop", "Burger"],
  Saute: ["Pan-Seared Salmon", "Duck Breast", "Chicken Marsala", "Shrimp Scampi", "Veal Piccata", "Sea Bass", "Lobster Tail", "Wild Mushroom Pasta", "Risotto"],
  Fryer: ["Truffle Fries", "Calamari", "Crispy Wings", "Onion Rings", "Tempura Shrimp", "Fish & Chips", "Fried Chicken", "Arancini"],
  "Garde Manger": ["Caesar Salad", "Burrata Salad", "Cheese Board", "Tuna Tartare", "Oysters (6pc)", "Shrimp Cocktail", "Caprese", "Garden Salad"],
  Pastry: ["Crème Brûlée", "Tiramisu", "Molten Chocolate Cake", "Cheesecake", "Fruit Tart", "Affogato"],
  Expo: ["Tasting Menu Course", "Table Fire", "Special Plating"],
};

const SERVERS = [
  "Lisa P.", "Carlos R.", "Sarah J.", "Marcus T.", "Emily W.", "David C.", "Marco T.", "Rosa H.",
];

const TABLE_NAMES = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "18", "22", "Bar 1", "Bar 2", "Bar 3", "Patio 1", "Patio 2",
];

// ── Seeded random for consistency within same minute ──
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// ── Time-of-day rush multiplier (California time) ──
function getRushMultiplier(): { multiplier: number; period: string } {
  const now = new Date();
  // Convert to California time
  const caHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hour12: false }));

  if (caHour >= 11 && caHour < 14) return { multiplier: 0.7, period: "Lunch Service" };
  if (caHour >= 17 && caHour < 19) return { multiplier: 0.85, period: "Early Dinner" };
  if (caHour >= 19 && caHour < 21) return { multiplier: 1.0, period: "Peak Dinner Rush" };
  if (caHour >= 21 && caHour < 23) return { multiplier: 0.6, period: "Late Dinner" };
  if (caHour >= 14 && caHour < 17) return { multiplier: 0.3, period: "Afternoon Prep" };
  return { multiplier: 0.15, period: "Off Hours" };
}

// ── Generate tickets ──
function generateTickets(rng: () => number, rushMult: number): KDSTicket[] {
  const baseCount = Math.max(2, Math.floor(6 + rushMult * 12));
  const count = Math.min(baseCount, 16);
  const tickets: KDSTicket[] = [];
  const usedTables = new Set<string>();
  const stations = Object.keys(MENU_BY_STATION);

  // Ticket counter based on current time slot (changes every ~2 minutes)
  const timeSlot = Math.floor(Date.now() / 120000);
  let ticketNum = 8900 + (timeSlot % 100);

  for (let i = 0; i < count; i++) {
    let table: string;
    do { table = pick(TABLE_NAMES, rng); } while (usedTables.has(table) && usedTables.size < TABLE_NAMES.length);
    usedTables.add(table);

    const station = pick(stations.filter(s => s !== "Expo"), rng);
    const itemCount = Math.floor(rng() * 3) + 1;
    const items = pickN(MENU_BY_STATION[station], itemCount, rng);

    // Time varies: some just fired, some mid-cook, some late
    const baseTime = Math.floor(rng() * 35) + 1;
    // Add some "aging" — older tickets more likely to be late
    const timeMinutes = Math.max(1, baseTime - Math.floor(rng() * 5));

    let status: KDSTicket["status"];
    if (timeMinutes > 22) status = "LATE";
    else if (timeMinutes > 15) status = "WARNING";
    else if (timeMinutes < 3) status = "FIRED";
    else status = "ON_TIME";

    const priority = rng() < 0.1 ? "vip" : rng() < 0.15 ? "rush" : "normal";

    tickets.push({
      id: `T-${ticketNum + i}`,
      table,
      server: pick(SERVERS, rng),
      items,
      timeMinutes,
      time: `${timeMinutes}m`,
      status,
      station,
      priority,
      coursing: rng() < 0.3 ? (rng() < 0.5 ? "Course 1/3" : "Course 2/3") : undefined,
    });
  }

  // Sort: LATE first, then WARNING, then ON_TIME, then FIRED
  const statusOrder = { LATE: 0, WARNING: 1, ON_TIME: 2, FIRED: 3 };
  tickets.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.timeMinutes - a.timeMinutes);

  return tickets;
}

// ── Generate station statuses ──
function generateStations(tickets: KDSTicket[], rng: () => number, rushMult: number): StationStatus[] {
  const stationNames = ["Grill", "Saute", "Fryer", "Garde Manger", "Pastry", "Expo"];
  const capacities: Record<string, number> = { Grill: 6, Saute: 5, Fryer: 4, "Garde Manger": 4, Pastry: 3, Expo: 8 };
  const baseAvgTimes: Record<string, number> = { Grill: 20, Saute: 15, Fryer: 10, "Garde Manger": 6, Pastry: 12, Expo: 3 };

  return stationNames.map(name => {
    const stationTickets = tickets.filter(t => t.station === name);
    const activeTickets = stationTickets.length;
    const capacity = capacities[name] || 4;
    const load = Math.min(100, Math.round((activeTickets / capacity) * 100 * rushMult + rng() * 15));

    // Avg time varies with load
    const baseAvg = baseAvgTimes[name] || 10;
    const loadFactor = 1 + (load / 100) * 0.5;
    const avgTime = Math.round(baseAvg * loadFactor * (0.85 + rng() * 0.3));

    let status: StationStatus["status"];
    if (load > 85 && avgTime > 18) status = "BOTTLENECK";
    else if (load > 70) status = "HIGH";
    else if (load < 20) status = "IDLE";
    else status = "OK";

    return { name, avgTime, load, status, activeTickets, capacity };
  });
}

// ── Main export: get full KDS snapshot ──
export function getKDSSnapshot() {
  const { multiplier, period } = getRushMultiplier();

  // Seed changes every 15 seconds for "live" feel
  const seed = Math.floor(Date.now() / 15000);
  const rng = seededRandom(seed);

  const tickets = generateTickets(rng, multiplier);
  const stations = generateStations(tickets, rng, multiplier);

  const lateTickets = tickets.filter(t => t.status === "LATE" || t.status === "WARNING");
  const avgTicketTime = tickets.length > 0
    ? Math.round(tickets.reduce((sum, t) => sum + t.timeMinutes, 0) / tickets.length)
    : 0;
  const longestTicket = tickets.length > 0
    ? tickets.reduce((max, t) => t.timeMinutes > max.timeMinutes ? t : max)
    : null;

  const throughput = Math.round(30 + multiplier * 25 + (rng() * 10 - 5));

  // AI recommendation based on current state
  const bottleneck = stations.find(s => s.status === "BOTTLENECK");
  const highStations = stations.filter(s => s.status === "HIGH");
  let aiRecommendation = "";
  if (bottleneck) {
    aiRecommendation = `${bottleneck.name} station averaging ${bottleneck.avgTime}m/ticket (target 15m) at ${bottleneck.load}% load. Recommend reallocating a prep cook to ${bottleneck.name} or throttling new orders for that station.`;
  } else if (highStations.length >= 2) {
    aiRecommendation = `Multiple stations running high: ${highStations.map(s => s.name).join(", ")}. Monitor closely; consider staggering ticket fires to prevent simultaneous bottlenecks.`;
  } else if (lateTickets.length > 0) {
    aiRecommendation = `${lateTickets.length} ticket(s) exceeding target time. Longest: ${longestTicket?.id} at ${longestTicket?.time}. Prioritize clearing these before accepting new fires.`;
  } else {
    aiRecommendation = `Kitchen running smoothly. All stations within target times. Current throughput: ${throughput} plates/hr.`;
  }

  return {
    period,
    rushMultiplier: multiplier,
    avgTicketTime: `${avgTicketTime}m ${Math.floor(rng() * 59).toString().padStart(2, "0")}s`,
    longestTicket: longestTicket
      ? `${longestTicket.time} (${longestTicket.id}, Table ${longestTicket.table} — ${longestTicket.items.join(", ")})`
      : "—",
    longestTicketMinutes: longestTicket?.timeMinutes || 0,
    openTickets: tickets.length,
    throughput: `${throughput} plates/hr`,
    throughputNum: throughput,
    tickets,
    lateTickets,
    stations,
    stationBottlenecks: stations.map(s => ({
      station: s.name,
      avgTime: `${s.avgTime}m`,
      load: `${s.load}%`,
      status: s.status,
      activeTickets: s.activeTickets,
    })),
    aiRecommendation,
    lastUpdated: new Date().toISOString(),
  };
}
