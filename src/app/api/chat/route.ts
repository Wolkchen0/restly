import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchGuests, getVipGuests, getTodayReservations } from "@/services/opentable";
import { getInventory, getLowStockItems, getInventoryStats } from "@/services/toast";
import { getAllTimeOffRequests, getPendingRequests, checkConflicts, getScheduleStats } from "@/services/timeoff";

export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new Response("Unauthorized", { status: 401 });

    const restaurantName = session.user?.name || "the restaurant";
    const { messages } = await req.json();

    const result = await streamText({
        model: openai("gpt-4o"),
        system: `You are the AI Restaurant Manager assistant for ${restaurantName}, a restaurant in California.
Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

You help the manager with:
1. Guest intelligence — preferences, visit history, VIP status (from OpenTable)
2. Inventory & stock management (from Toast POS)
3. Time-off requests and scheduling conflict checking
4. Schedule management and staffing recommendations

RULES:
- California CCPA/CPRA compliance — never share customer PII unnecessarily.
- Be concise, professional, and action-oriented.
- Use bullet points for multiple items.
- Always refer to the restaurant as "${restaurantName}".`,
        messages,
        tools: {
            lookup_guest: tool({
                description: "Look up a guest by name — visit history, preferences, VIP status, spend",
                parameters: z.object({ name: z.string() }),
                execute: async ({ name }) => {
                    const results = searchGuests(name);
                    if (!results.length) return { found: false, message: `No guest matching "${name}"` };
                    return { found: true, guests: results.map(g => ({ name: `${g.firstName} ${g.lastName}`, visitCount: g.visitCount, lastVisit: g.lastVisit, isVip: g.isVip, preferences: g.preferences, dietaryNotes: g.dietaryNotes, favoriteItems: g.favoriteItems, averageSpend: `$${g.averageSpend}`, notes: g.notes })) };
                },
            }),
            get_todays_reservations: tool({
                description: "Get all reservations for today",
                parameters: z.object({}),
                execute: async () => {
                    const r = getTodayReservations();
                    return { totalCovers: r.reduce((a, x) => a + x.partySize, 0), count: r.length, vipCount: r.filter(x => x.isVip).length, reservations: r.map(x => ({ time: x.time, guest: x.guestName, partySize: x.partySize, table: `Table ${x.tableNumber}`, isVip: x.isVip, notes: x.notes, status: x.status })) };
                },
            }),
            get_vip_guests: tool({
                description: "Get VIP guest list",
                parameters: z.object({}),
                execute: async () => { const v = getVipGuests(); return { count: v.length, vips: v.map(g => ({ name: `${g.firstName} ${g.lastName}`, visits: g.visitCount, avgSpend: `$${g.averageSpend}`, preferences: g.preferences.join(", ") })) }; },
            }),
            check_inventory: tool({
                description: "Check inventory levels — specific item or overview",
                parameters: z.object({ item: z.string().optional() }),
                execute: async ({ item }) => {
                    if (item) { const all = getInventory(); const found = all.filter(i => i.name.toLowerCase().includes(item.toLowerCase())); return found.length ? { found: true, items: found } : { found: false, message: `No item matching "${item}"` }; }
                    return { stats: getInventoryStats(), lowAndOutOfStock: getLowStockItems() };
                },
            }),
            get_low_stock_alerts: tool({
                description: "Get low/out-of-stock items",
                parameters: z.object({}),
                execute: async () => { const i = getLowStockItems(); return { count: i.length, outOfStock: i.filter(x => x.status === "OUT_OF_STOCK"), lowStock: i.filter(x => x.status === "LOW_STOCK") }; },
            }),
            get_timeoff_requests: tool({
                description: "Get staff time-off requests",
                parameters: z.object({ filter: z.enum(["pending", "approved", "all"]).default("pending") }),
                execute: async ({ filter }) => {
                    const r = filter === "pending" ? getPendingRequests() : filter === "all" ? getAllTimeOffRequests() : getAllTimeOffRequests().filter(x => x.status === "APPROVED");
                    return { stats: getScheduleStats(), requests: r };
                },
            }),
            check_schedule_conflict: tool({
                description: "Check if dates conflict with other time-off requests",
                parameters: z.object({ startDate: z.string(), endDate: z.string() }),
                execute: async ({ startDate, endDate }) => {
                    const c = checkConflicts(startDate, endDate);
                    return { hasConflicts: c.length > 0, conflictCount: c.length, conflicts: c.map(x => ({ employee: x.employeeName, role: x.employeeRole, dates: `${x.startDate} → ${x.endDate}`, status: x.status })), recommendation: c.length > 2 ? "⚠️ High conflict — consider denying" : c.length > 0 ? "⚠️ Some overlap — review before approving" : "✅ No conflicts — safe to approve" };
                },
            }),
        },
    });

    return result.toDataStreamResponse();
}
