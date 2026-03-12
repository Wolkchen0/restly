// Mock OpenTable Data - Demo mode (replace with real API when credentials are ready)
export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitCount: number;
  lastVisit: string;
  preferences: string[];
  dietaryNotes: string;
  averageSpend: number;
  isVip: boolean;
  favoriteItems: string[];
  specialOccasions: string[];
  averagePartySize: number;
  notes: string;
}

export interface Reservation {
  id: string;
  guestId: string;
  guestName: string;
  partySize: number;
  time: string;
  tableNumber: number;
  status: "confirmed" | "seated" | "completed" | "cancelled";
  isVip: boolean;
  notes: string;
}

let guestList: Guest[] = [
  {
    id: "g1",
    firstName: "James",
    lastName: "Hartley",
    email: "j.hartley@email.com",
    phone: "(310) 555-0182",
    visitCount: 28,
    lastVisit: "2026-03-01",
    preferences: ["Window seat", "Quiet table", "Wine pairings"],
    dietaryNotes: "Gluten-free",
    averageSpend: 185,
    isVip: true,
    favoriteItems: ["Pan-Seared Duck", "Truffle Risotto", "Crème Brûlée"],
    specialOccasions: ["Anniversary - March 15"],
    averagePartySize: 2,
    notes: "Prefers Bordeaux wines. Always orders dessert."
  },
  {
    id: "g2",
    firstName: "Sofia",
    lastName: "Martinez",
    email: "sofia.m@email.com",
    phone: "(424) 555-0293",
    visitCount: 15,
    lastVisit: "2026-02-28",
    preferences: ["Bar seating", "Chef's table"],
    dietaryNotes: "Vegetarian",
    averageSpend: 120,
    isVip: false,
    favoriteItems: ["Wild Mushroom Pasta", "Burrata Salad", "Tiramisu"],
    specialOccasions: ["Birthday - April 8"],
    averagePartySize: 4,
    notes: "Frequent business dinners. Appreciates prompt service."
  },
  {
    id: "g3",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@email.com",
    phone: "(213) 555-0441",
    visitCount: 42,
    lastVisit: "2026-03-03",
    preferences: ["Private dining room", "Early seating"],
    dietaryNotes: "No shellfish allergy",
    averageSpend: 320,
    isVip: true,
    favoriteItems: ["Wagyu Beef Tenderloin", "Lobster Bisque", "Cheese Board"],
    specialOccasions: ["Birthday - October 22", "Wedding Anniversary - July 4"],
    averagePartySize: 6,
    notes: "VIP client. Always books private room for business. CEO of local tech firm."
  },
  {
    id: "g4",
    firstName: "Emma",
    lastName: "Thompson",
    email: "e.thompson@email.com",
    phone: "(818) 555-0677",
    visitCount: 8,
    lastVisit: "2026-02-20",
    preferences: ["Patio seating"],
    dietaryNotes: "Vegan",
    averageSpend: 75,
    isVip: false,
    favoriteItems: ["Garden Salad", "Roasted Vegetable Platter"],
    specialOccasions: [],
    averagePartySize: 3,
    notes: "Usually comes for weekend brunch."
  },
  {
    id: "g5",
    firstName: "Robert",
    lastName: "Williams",
    email: "r.williams@email.com",
    phone: "(310) 555-0815",
    visitCount: 33,
    lastVisit: "2026-03-02",
    preferences: ["Corner booth", "Low lighting"],
    dietaryNotes: "None",
    averageSpend: 210,
    isVip: true,
    favoriteItems: ["Prime Ribeye", "Truffle Fries", "Old Fashioned"],
    specialOccasions: ["Anniversary - December 31"],
    averagePartySize: 2,
    notes: "Loyal regular since opening. Always tips generously."
  },
  {
    id: "g6",
    firstName: "Aisha",
    lastName: "Johnson",
    email: "a.johnson@email.com",
    phone: "(323) 555-0934",
    visitCount: 5,
    lastVisit: "2026-01-15",
    preferences: ["None specified"],
    dietaryNotes: "Halal",
    averageSpend: 95,
    isVip: false,
    favoriteItems: ["Grilled Salmon", "Caesar Salad"],
    specialOccasions: [],
    averagePartySize: 5,
    notes: "Group reservations, usually for celebrations."
  },
  {
    id: "g7",
    firstName: "David",
    lastName: "Park",
    email: "d.park@email.com",
    phone: "(626) 555-0127",
    visitCount: 19,
    lastVisit: "2026-02-25",
    preferences: ["Main dining", "Semi-private"],
    dietaryNotes: "No pork",
    averageSpend: 155,
    isVip: false,
    favoriteItems: ["Filet Mignon", "Seasonal Soup", "Molten Chocolate Cake"],
    specialOccasions: ["Birthday - May 30"],
    averagePartySize: 2,
    notes: "Regular business lunches on Fridays."
  },
  {
    id: "g8",
    firstName: "Claire",
    lastName: "Dubois",
    email: "c.dubois@email.com",
    phone: "(424) 555-0368",
    visitCount: 11,
    lastVisit: "2026-03-01",
    preferences: ["Wine tasting menu"],
    dietaryNotes: "None",
    averageSpend: 270,
    isVip: false,
    favoriteItems: ["Tasting Menu", "Sommelier Pairing"],
    specialOccasions: [],
    averagePartySize: 2,
    notes: "Fine wine enthusiast. Interested in upcoming wine events."
  }
];

const TODAY_RESERVATIONS: Reservation[] = [
  { id: "r1", guestId: "g3", guestName: "Michael Chen", partySize: 6, time: "6:00 PM", tableNumber: 12, status: "confirmed", isVip: true, notes: "Private room requested" },
  { id: "r2", guestId: "g1", guestName: "James Hartley", partySize: 2, time: "7:00 PM", tableNumber: 5, status: "confirmed", isVip: true, notes: "Anniversary dinner" },
  { id: "r3", guestId: "g5", guestName: "Robert Williams", partySize: 2, time: "7:30 PM", tableNumber: 8, status: "confirmed", isVip: true, notes: "Corner booth" },
  { id: "r4", guestId: "g7", guestName: "David Park", partySize: 2, time: "6:30 PM", tableNumber: 3, status: "confirmed", isVip: false, notes: "" },
  { id: "r5", guestId: "g2", guestName: "Sofia Martinez", partySize: 4, time: "8:00 PM", tableNumber: 9, status: "confirmed", isVip: false, notes: "Business dinner" },
  { id: "r6", guestId: "g8", guestName: "Claire Dubois", partySize: 2, time: "8:30 PM", tableNumber: 6, status: "confirmed", isVip: false, notes: "Wine pairing menu" },
  { id: "r7", guestId: "g4", guestName: "Emma Thompson", partySize: 3, time: "7:00 PM", tableNumber: 14, status: "confirmed", isVip: false, notes: "Patio preferred" },
];

export function getAllGuests(): Guest[] {
  return guestList;
}

export function searchGuests(query: string): Guest[] {
  const q = query.toLowerCase();
  return guestList.filter(
    g =>
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q)
  );
}

export function getGuestById(id: string): Guest | undefined {
  return guestList.find(g => g.id === id);
}

export function getTodayReservations(): Reservation[] {
  return TODAY_RESERVATIONS;
}

export function getVipGuests(): Guest[] {
  return guestList.filter(g => g.isVip);
}

export function getStats() {
  return {
    totalGuests: guestList.length,
    vipGuests: guestList.filter(g => g.isVip).length,
    coversToday: TODAY_RESERVATIONS.reduce((acc, r) => acc + r.partySize, 0),
    reservationsToday: TODAY_RESERVATIONS.length,
    avgSpend: Math.round(guestList.reduce((acc, g) => acc + g.averageSpend, 0) / guestList.length),
  };
}

export function addOrUpdateGuest(name: string, isVip: boolean, notes?: string): Guest {
  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.slice(1).join(" ") || "";
  
  // Check if guest already exists
  const existing = guestList.find(g => 
    g.firstName.toLowerCase() === firstName.toLowerCase() && 
    g.lastName.toLowerCase() === lastName.toLowerCase()
  );
  
  if (existing) {
    existing.isVip = isVip;
    if (notes) existing.notes = notes;
    return existing;
  }
  
  // Add new guest
  const newGuest: Guest = {
    id: `g${guestList.length + 1}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    phone: "",
    visitCount: 1,
    lastVisit: new Date().toISOString().split("T")[0],
    preferences: [],
    dietaryNotes: "",
    averageSpend: 0,
    isVip,
    favoriteItems: [],
    specialOccasions: [],
    averagePartySize: 2,
    notes: notes || (isVip ? "Added as VIP via Restly AI." : "Added via Restly AI."),
  };
  guestList = [newGuest, ...guestList];
  return newGuest;
}
