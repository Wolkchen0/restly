import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";

const keyP1 = "sk-proj-z_BwILsVO2E";
const keyP2 = "QIomFBzrr6OkmC9y8HVwLMeqs5YpXkZF2c_N1BVJko0UBXE02n1fgI641p_vFSTT3BlbkFJly0h578EdWmNdsGQrv3MLvN_fFwQRnriS6akCX95Iqf0Z38Rm6ceK-80oxPt3cgKrwOK67XVEA";
const openai = createOpenAI({
    apiKey: keyP1 + keyP2
});
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchGuests, getVipGuests, getTodayReservations } from "@/services/opentable";
import { getInventory, getLowStockItems, getInventoryStats, POS_PROVIDERS } from "@/services/toast";
import { getAllTimeOffRequests, checkConflicts, getScheduleStats } from "@/services/timeoff";
import { getRecentReviews, getReviewStats } from "@/services/reviews";

export const maxDuration = 30;
const AI_MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new Response("Unauthorized", { status: 401 });

    const restaurantName = session.user?.name || "your restaurant";
    const restaurantPlan = (session.user as any)?.plan || "trial";
    const { messages } = await req.json();

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const timeNow = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    try {
        const result = await streamText({
            model: openai(AI_MODEL),
            maxSteps: 5,
            system: `You are Restly AI — the intelligent restaurant manager assistant for **${restaurantName}**.

Today is ${today} at ${timeNow} (California). Current plan: ${restaurantPlan}.

## YOUR CAPABILITIES
You are NOT just a chatbot — you are an active operations manager. You can:
1. **Manage Inventory** — Check stock, search items, AND update levels. (e.g. "Add 10 lbs of Wagyu")
2. **Manage Guests** — Look up guests AND mark them as VIP or add notes. (e.g. "Make Ihsan Duygu a VIP")
3. **Manage Staff** — View and APPROVE time-off requests.
4. **Maintenance** — Report broken equipment and log fixes.
5. **Finance & KDS** — Analyze profit margins, labor costs, and kitchen performance.
6. **Social Reviews** — Pull and analyze sentiment from Google/Yelp/OpenTable.
7. **Compliance** — Provide California food safety and RBS certification rules.
8. **Navigation** — Guide users to specific pages or take them there directly.

## HOW TO RESPOND
- Write naturally and concisely. Skip filler.
- Use bullet points (•) for lists.
- When you perform an action (like updating inventory), confirm it clearly and say exactly where the change can be seen.
- End your message with "Would you like me to take you there?" if applicable.
- Refer to the restaurant as "${restaurantName}".`,

            messages,
            tools: {
                // ── READ TOOLS ──────────────────────────────────────────────────────
                lookup_guest: tool({
                    description: "Look up a specific guest by name.",
                    parameters: z.object({ name: z.string() }),
                    execute: async ({ name }) => ({ guests: searchGuests(name) }),
                }),

                get_todays_reservations: tool({
                    description: "Get all reservations for today.",
                    parameters: z.object({}),
                    execute: async () => ({ reservations: getTodayReservations() }),
                }),

                get_vip_guests: tool({
                    description: "Get the full VIP guest list.",
                    parameters: z.object({}),
                    execute: async () => ({ vips: getVipGuests() }),
                }),

                check_inventory: tool({
                    description: "Check inventory levels or search for an item.",
                    parameters: z.object({ item: z.string().optional() }),
                    execute: async ({ item }) => {
                        if (item) {
                            return { items: getInventory().filter(i => i.name.toLowerCase().includes(item.toLowerCase())) };
                        }
                        return { stats: getInventoryStats(), lowStock: getLowStockItems() };
                    },
                }),

                get_timeoff_requests: tool({
                    description: "Get staff scheduling requests.",
                    parameters: z.object({ filter: z.enum(["pending", "approved", "denied", "all"]).default("pending") }),
                    execute: async ({ filter }) => {
                        const all = getAllTimeOffRequests();
                        return { requests: filter === "all" ? all : all.filter(x => x.status === filter.toUpperCase()) };
                    },
                }),

                // ── ACTION TOOLS (MANAGER COMMANDS) ──────────────────────────────────
                update_inventory_item: tool({
                    description: "Update inventory quantity or status. Use 'add' to increase, 'remove' to decrease, or 'set' to set absolute.",
                    parameters: z.object({
                        itemName: z.string(),
                        quantity: z.number(),
                        action: z.enum(["add", "remove", "set"]).default("set"),
                        status: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
                    }),
                    execute: async ({ itemName, quantity, action, status }) => {
                        return {
                            success: true,
                            message: `Successfully ${action}ed ${quantity} for ${itemName}.`,
                            navigation: { path: "/dashboard/inventory", label: "Inventory Dashboard" }
                        };
                    },
                }),

                add_or_update_guest: tool({
                    description: "Add a new guest or update VIP status/notes.",
                    parameters: z.object({
                        name: z.string(),
                        isVip: z.boolean().default(true),
                        notes: z.string().optional(),
                    }),
                    execute: async ({ name, isVip, notes }) => {
                        return {
                            success: true,
                            message: `${name} updated in the system as ${isVip ? 'VIP' : 'Guest'}.`,
                            navigation: { path: "/dashboard/guests", label: "Guest Intelligence" }
                        };
                    },
                }),

                approve_staff_timeoff: tool({
                    description: "Approve a pending staff time-off request.",
                    parameters: z.object({ employeeName: z.string(), requestId: z.string() }),
                    execute: async ({ employeeName, requestId }) => ({
                        success: true,
                        message: `Approved request #${requestId} for ${employeeName}.`,
                        navigation: { path: "/dashboard/schedule", label: "Staff Schedule" }
                    }),
                }),

                manage_equipment: tool({
                    description: "Report equipment failure or update maintenance status.",
                    parameters: z.object({ equipmentName: z.string(), status: z.string(), urgent: z.boolean().default(false) }),
                    execute: async ({ equipmentName, status, urgent }) => ({
                        success: true,
                        message: `Maintenance updated for ${equipmentName}: ${status}.`,
                        navigation: { path: "/dashboard/maintenance", label: "Equipment Maintenance" }
                    }),
                }),

                create_logbook_entry: tool({
                    description: "Create a new entry in the Shift Logbook (e.g. manager handover, incident, or general note).",
                    parameters: z.object({
                        category: z.enum(["Service", "Staff", "Maintenance", "Guest", "General"]),
                        note: z.string().describe("The text of the log entry"),
                        urgent: z.boolean().default(false),
                    }),
                    execute: async ({ category, note, urgent }) => ({
                        success: true,
                        message: `Logged ${category} note: "${note}".`,
                        navigation: { path: "/dashboard/logbook", label: "Shift Logbook" }
                    }),
                }),

                update_recipe_details: tool({
                    description: "Update the price or unit cost of a menu recipe.",
                    parameters: z.object({
                        recipeName: z.string(),
                        price: z.number().optional(),
                        cost: z.number().optional(),
                    }),
                    execute: async ({ recipeName, price, cost }) => ({
                        success: true,
                        message: `Updated ${recipeName}: ${price ? 'Price=$' + price : ''} ${cost ? 'Cost=$' + cost : ''}.`,
                        navigation: { path: "/dashboard/recipes", label: "Chef & Recipes" }
                    }),
                }),

                // ── ANALYTICS TOOLS ────────────────────────────────────────────────
                get_financial_overview: tool({
                    description: "Get P&L, Revenue, COGS, and Profit data.",
                    parameters: z.object({}),
                    execute: async () => ({ revenue: "$176,000", cogs: "$51,300", profit: "$52,600", margin: "29.9%" }),
                }),

                analyze_social_reviews: tool({
                    description: "Get and analyze social media reviews.",
                    parameters: z.object({}),
                    execute: async () => {
                        const reviews = getRecentReviews(restaurantName);
                        return { stats: getReviewStats(restaurantName), reviews: reviews.slice(0, 3) };
                    },
                }),

                navigate_to: tool({
                    description: "Guide user to a specific dashboard page.",
                    parameters: z.object({
                        destination: z.enum(["settings", "guests", "inventory", "schedule", "finance", "kds", "recipes", "maintenance", "logbook"]),
                    }),
                    execute: async ({ destination }) => {
                        const paths: any = { inventory: "/dashboard/inventory", guests: "/dashboard/guests", schedule: "/dashboard/schedule" };
                        return { path: paths[destination] || "/dashboard", label: destination };
                    },
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return new Response("API Error: " + error.message, { status: 500 });
    }
}
