import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchGuests, getVipGuests, getTodayReservations } from "@/services/opentable";
import { getInventory, getLowStockItems, getInventoryStats, POS_PROVIDERS } from "@/services/toast";
import { getAllTimeOffRequests, getPendingRequests, checkConflicts, getScheduleStats } from "@/services/timeoff";
import { getRecentReviews, getReviewStats } from "@/services/reviews";

export const maxDuration = 30;

// Use GPT-4o-mini to keep costs low (16x cheaper than GPT-4o, still excellent quality)
// Cost per restaurant: ~$0.50-1.50/month — fully absorbed by platform pricing
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
You are NOT just a chatbot — you are an active operations assistant. You can:
1. **Read guest data** — look up guests, VIPs, today's reservations, dining preferences, dietary notes
2. **Read inventory** — check stock levels, low-stock alerts, cost-per-unit, supplier info
3. **Read staff schedule** — view time-off requests, approve/deny recommendations, check conflicts
4. **Analyze P&L and Finance** — provide net profit margins, labor cost, and COGS updates
5. **Analyze Kitchen Performance** — monitor KDS bottlenecks and average ticket times
6. **Manage Chef & Recipes** — track recipe costs, profit margins, and AI photo breakdown
7. **Equipment Maintenance** — check status of appliances, report broken equipment, and log fix requests
10. **Analyze Social Media Reviews** — pull the latest reviews from Google, Yelp, and OpenTable, assess sentiment, and track brand reputation.
11. **California Training & Compliance (Pro Plan Only)** — provide up-to-date CA rules for food handling and alcohol serving, and explain how to schedule on-site training.
12. **Guide setup & onboarding** — explain exactly how to connect any POS system, get API keys, configure OpenTable
13. **Navigate the system** — tell users exactly where to go if they ask about these features

## INTEGRATION SETUP KNOWLEDGE
When users ask how to connect a POS or don't know what to do:

**Toast POS:**
- Go to: pos.toasttab.com → Back Office → Settings → Integrations → API Access
- Create API Key → Select "Inventory Read" + "Menu Read" scopes
- Restaurant GUID: found in the URL bar when logged into Toast
- Then go to: Restly Settings → POS Integration → Select Toast → Paste credentials

**Clover:**
- Go to: clover.com → Dashboard → Account & Setup → API Tokens
- Create token with "Inventory" and "Orders" permissions
- Merchant ID: shown at top-right of your Clover Dashboard
- Then go to: Restly Settings → POS Integration → Select Clover → Paste credentials

**Square:**
- Go to: developer.squareup.com → Applications → New Application
- OAuth → Production Access Token
- Location ID: Square Dashboard → Account & Settings → Business information
- Then go to: Restly Settings → POS Integration → Select Square → Paste credentials

**Lightspeed:**
- Go to: lightspeedhq.com → Account Settings → API Access → Create New Key
- Then go to: Restly Settings → POS Integration → Select Lightspeed

**OpenTable, Google Business, Yelp (1-Click Connect):**
- You do NOT need complicated API keys for these!
- Go to: Restly Dashboard → Settings (gear icon) → "Locations & Integrations" tab
- Scroll down to "Online Profiles & Reviews"
- Click the "Connect Google", "Connect Yelp", or "Connect OpenTable" button for an instant 1-click setup. 
- Tell the user: "Head over to Settings > Locations & Integrations and click the connect button. It's that easy!"

## HOW TO RESPOND
- Be direct and action-oriented. Skip filler phrases.
- Use emojis sparingly for clarity (✅, ⚠️, 📦, 👤)
- Use bullet points for lists, bold for key terms
- When guiding setup steps: number them clearly
- **When a user asks WHERE to find something (like where to put API keys or where a feature is):** Explain where it is, and ALWAYS end your message with: "Would you like me to take you there?"
- When you don't have data (live API not connected): use available demo data and note it's demo
- Always speak as if you're a knowledgeable colleague, not a corporate chatbot
- Refer to the restaurant as "${restaurantName}"

## RULES
- California CCPA/CPRA: Never share customer PII unnecessarily
- Do not reveal your underlying model or that you're powered by OpenAI
- If asked about pricing or plans, say "please check the Settings page for plan details"`,

            messages,
            tools: {
                // ── GUEST TOOLS ──────────────────────────────────────────────────────
                lookup_guest: tool({
                    description: "Look up a specific guest by name — visit history, preferences, VIP status, dietary notes, spend",
                    parameters: z.object({ name: z.string().describe("Guest first or last name") }),
                    execute: async ({ name }) => {
                        const results = searchGuests(name);
                        if (!results.length) return { found: false, message: `No guest matching "${name}" found in the system.` };
                        return {
                            found: true,
                            guests: results.map(g => ({
                                name: `${g.firstName} ${g.lastName}`,
                                visitCount: g.visitCount,
                                lastVisit: g.lastVisit,
                                isVip: g.isVip,
                                preferences: g.preferences,
                                dietaryNotes: g.dietaryNotes,
                                favoriteItems: g.favoriteItems,
                                averageSpend: `$${g.averageSpend}`,
                                specialOccasions: g.specialOccasions,
                                notes: g.notes,
                            })),
                        };
                    },
                }),

                get_todays_reservations: tool({
                    description: "Get all reservations for today — covers count, VIP guests, party details",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { message: "No reservations found. OpenTable integration is not set up." };
                        const r = getTodayReservations();
                        return {
                            totalCovers: r.reduce((a, x) => a + x.partySize, 0),
                            reservationCount: r.length,
                            vipCount: r.filter(x => x.isVip).length,
                            reservations: r.map(x => ({
                                time: x.time,
                                guest: x.guestName,
                                partySize: x.partySize,
                                table: `Table ${x.tableNumber}`,
                                isVip: x.isVip,
                                notes: x.notes,
                                status: x.status,
                            })),
                        };
                    },
                }),

                get_vip_guests: tool({
                    description: "Get the full VIP guest list with preferences and spending",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { count: 0, vips: [], message: "No OpenTable integration found." };
                        const v = getVipGuests();
                        return {
                            count: v.length,
                            vips: v.map(g => ({
                                name: `${g.firstName} ${g.lastName}`,
                                visits: g.visitCount,
                                avgSpend: `$${g.averageSpend}`,
                                preferences: g.preferences.join(", "),
                                dietaryNotes: g.dietaryNotes,
                                favoriteItems: g.favoriteItems,
                            })),
                        };
                    },
                }),

                // ── INVENTORY TOOLS ─────────────────────────────────────────────────
                check_inventory: tool({
                    description: "Check inventory — overview stats, or search for a specific item",
                    parameters: z.object({ item: z.string().optional().describe("Item name to search, or omit for overview") }),
                    execute: async ({ item }) => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { found: false, message: "Inventory integration not set up. Connect Toast/Square POS." };
                        if (item) {
                            const all = getInventory();
                            const found = all.filter(i => i.name.toLowerCase().includes(item.toLowerCase()));
                            return found.length
                                ? { found: true, items: found.map(i => ({ name: i.name, status: i.status, quantity: `${i.quantity} ${i.unit}`, cost: `$${i.costPerUnit}/${i.unit}`, supplier: i.supplier })) }
                                : { found: false, message: `No item matching "${item}" found in inventory.` };
                        }
                        return { stats: getInventoryStats(), lowAndOutOfStock: getLowStockItems() };
                    },
                }),

                get_low_stock_alerts: tool({
                    description: "Get all low stock and out-of-stock items requiring immediate attention",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { totalAlerts: 0, outOfStock: [], lowStock: [], urgency: "NONE", message: "Inventory integration not set up. Connect Toast/Square POS." };
                        const items = getLowStockItems();
                        return {
                            totalAlerts: items.length,
                            outOfStock: items.filter(x => x.status === "OUT_OF_STOCK").map(i => ({ name: i.name, category: i.category, supplier: i.supplier })),
                            lowStock: items.filter(x => x.status === "LOW_STOCK").map(i => ({ name: i.name, quantity: `${i.quantity} ${i.unit}`, threshold: i.threshold, supplier: i.supplier })),
                            urgency: items.filter(x => x.status === "OUT_OF_STOCK").length > 0 ? "CRITICAL" : "WARNING",
                        };
                    },
                }),

                // ── SCHEDULE TOOLS ───────────────────────────────────────────────────
                get_timeoff_requests: tool({
                    description: "Get staff scheduling requests. This includes both 'Time-Off Requests' and 'Time Entry Fix Requests'. Filter them by status (pending, approved, denied).",
                    parameters: z.object({ filter: z.enum(["pending", "approved", "denied", "all"]).default("pending") }),
                    execute: async ({ filter }) => {
                        const all = getAllTimeOffRequests();
                        const filtered = filter === "all" ? all : all.filter(x => x.status === filter.toUpperCase());

                        const mappedRequests = filtered.map(r => ({
                            ...r,
                            requestType: r.formSource === 1 ? "Time Entry Fix Request" : "Time Off Request",
                        }));

                        return { stats: getScheduleStats(), requests: mappedRequests };
                    },
                }),

                check_schedule_conflict: tool({
                    description: "Check if a date range conflicts with existing approved time-off",
                    parameters: z.object({ startDate: z.string(), endDate: z.string() }),
                    execute: async ({ startDate, endDate }) => {
                        const c = checkConflicts(startDate, endDate);
                        return {
                            hasConflicts: c.length > 0,
                            conflictCount: c.length,
                            conflicts: c.map(x => ({ employee: x.employeeName, role: x.employeeRole, dates: `${x.startDate} → ${x.endDate}`, status: x.status })),
                            recommendation: c.length > 2 ? "⚠️ High conflict — strongly consider denying or scheduling partial approval" : c.length > 0 ? "⚠️ Some overlap — review staffing before approving" : "✅ No conflicts detected — safe to approve",
                        };
                    },
                }),

                // ── SYSTEM NAVIGATION TOOLS ─────────────────────────────────────────
                navigate_to: tool({
                    description: "Tell the user where to go in the Restly dashboard to perform an action",
                    parameters: z.object({
                        destination: z.enum(["settings", "settings_pos", "settings_opentable", "guests", "inventory", "schedule", "finance", "kds", "recipes", "maintenance", "logbook"]),
                        reason: z.string().describe("Why we're navigating there"),
                    }),
                    execute: async ({ destination, reason }) => {
                        const paths: Record<string, { path: string; label: string; instructions: string }> = {
                            settings: { path: "/dashboard/settings", label: "Settings", instructions: "Click ⚙️ Settings in the left sidebar to open your restaurant settings." },
                            settings_pos: { path: "/dashboard/settings", label: "Settings → POS", instructions: "Go to ⚙️ Settings → scroll to 'POS Integration' → choose your POS system and enter your credentials." },
                            settings_opentable: { path: "/dashboard/settings", label: "Settings → OpenTable", instructions: "Go to ⚙️ Settings → scroll to 'OpenTable Integration' → enter your Client ID, Client Secret, and Restaurant ID." },
                            guests: { path: "/dashboard/guests", label: "Guest Intelligence", instructions: "Click 👤 Guest Intelligence in the sidebar to view guest profiles and reservations." },
                            inventory: { path: "/dashboard/inventory", label: "Inventory", instructions: "Click 📦 Inventory in the sidebar to view stock levels and alerts." },
                            schedule: { path: "/dashboard/schedule", label: "Schedule", instructions: "Click 📅 Schedule in the sidebar to view time-off requests and submit forms." },
                            finance: { path: "/dashboard/finance", label: "P&L / Finance", instructions: "Click 📈 P&L / Finance in the sidebar." },
                            kds: { path: "/dashboard/kds", label: "Kitchen Performance", instructions: "Click 🍳 Kitchen Performance in the sidebar." },
                            recipes: { path: "/dashboard/recipes", label: "Chef & Recipes", instructions: "Click 🍽️ Chef & Recipes in the sidebar." },
                            maintenance: { path: "/dashboard/maintenance", label: "Maintenance", instructions: "Click 🔧 Maintenance in the sidebar." },
                            logbook: { path: "/dashboard/logbook", label: "Shift Logbook", instructions: "Click 📓 Shift Logbook in the sidebar." },
                        };
                        return { ...paths[destination], reason, actionRequired: true };
                    },
                }),

                // ── POS INTEGRATION GUIDE ───────────────────────────────────────────
                get_pos_setup_guide: tool({
                    description: "Get detailed step-by-step instructions for connecting a specific POS system",
                    parameters: z.object({ pos: z.enum(["toast", "clover", "square", "lightspeed", "revel"]) }),
                    execute: async ({ pos }) => {
                        const provider = POS_PROVIDERS[pos];
                        return {
                            posName: provider.name,
                            icon: provider.icon,
                            requiredFields: provider.setupFields,
                            stepsToGetCredentials: {
                                toast: [
                                    "1. Log in at pos.toasttab.com",
                                    "2. Click Back Office (top right)",
                                    "3. Go to Settings → Integrations → API Access",
                                    "4. Click 'Create API Key' → Name it 'Restly'",
                                    "5. Select scopes: Inventory Read + Menu Read",
                                    "6. Copy the API Key and Restaurant GUID (in URL bar)",
                                ],
                                clover: [
                                    "1. Log in at clover.com",
                                    "2. Go to Account & Setup → API Tokens",
                                    "3. Click 'Create New Token' → Name it 'Restly'",
                                    "4. Enable permissions: Inventory, Orders, Employees",
                                    "5. Copy the API Token",
                                    "6. Your Merchant ID is shown at top-right of Dashboard",
                                ],
                                square: [
                                    "1. Go to developer.squareup.com",
                                    "2. Sign in → Click 'Create Application'",
                                    "3. Name it 'Restly' → click 'Create'",
                                    "4. Go to OAuth tab → copy Production Access Token",
                                    "5. Location ID: Square Dashboard → Account & Settings → Business",
                                ],
                                lightspeed: [
                                    "1. Log in at lightspeedhq.com",
                                    "2. Go to Account dropdown → Account Settings",
                                    "3. Click 'API Access' → 'Create New Key'",
                                    "4. Name it 'Restly' → enable Inventory access",
                                    "5. Copy Client ID and Client Secret",
                                ],
                                revel: [
                                    "1. Log in to your Revel Management Console",
                                    "2. Go to Settings → API → Create New API User",
                                    "3. Copy API Key and API Secret",
                                    "4. Find your Establishment ID in Dashboard URL",
                                ],
                            }[pos] || [],
                            nextStep: `After collecting credentials, go to ⚙️ Settings → POS Integration → Select ${provider.name} → paste your credentials`,
                        };
                    },
                }),

                // ── FINANCE TOOLS ────────────────────────────────────────────────────
                get_financial_overview: tool({
                    description: "Get financial performance, profit and loss (P&L), Net Profit, COGS, and Labor costs. Useful for questions like 'what is my profit today?' or 'show me my financial stats'.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { message: "Finance module locked. Please connect your POS and Payroll system." };
                        const totalRevenue = 176000;
                        const cogs = 51300;
                        const labor = 57100;
                        const operatingEx = 15000;
                        const netProfit = totalRevenue - cogs - labor - operatingEx;
                        return {
                            totalRevenue: `$${totalRevenue.toLocaleString()}`,
                            cogs: `$${cogs.toLocaleString()}`,
                            labor: `$${labor.toLocaleString()}`,
                            operatingExpenses: `$${operatingEx.toLocaleString()}`,
                            netProfit: `$${netProfit.toLocaleString()}`,
                            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(1) + "%",
                            period: "Month-to-Date"
                        };
                    },
                }),

                // ── KITCHEN / KDS TOOLS ─────────────────────────────────────────────
                get_kitchen_performance: tool({
                    description: "Get kitchen station performance, average ticket times, and identify bottlenecks.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { message: "No KDS connected." };
                        return {
                            averageTicketTime: "18m 30s",
                            longestTicket: "28m 05s",
                            openTickets: 14,
                            throughputPerHour: 42,
                            bottleneck: "Grill station (24m avg, target 15m)",
                            recommendation: "Shift a prep cook to the Grill line or 86 well-done steaks immediately to clear backlog."
                        };
                    },
                }),

                // ── RECIPE TOOLS ────────────────────────────────────────────────────
                get_recipe_costs: tool({
                    description: "Get the cost, price, and COGS for menu items and recipes.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { message: "Recipe costing requires integration with your supplier invoices." };
                        return {
                            recipes: [
                                { name: "Truffle Burger", cost: "$3.45", price: "$16.00", cogs: "21.5%" },
                                { name: "Avocado Toast", cost: "$1.80", price: "$12.00", cogs: "15.0%" },
                                { name: "Spicy Marg", cost: "$1.10", price: "$14.00", cogs: "7.8%" },
                            ],
                            aiPhotoExtraction: "Available. Users can upload a photo of a recipe card, and Restly AI extracts the cost and maps it to inventory."
                        };
                    },
                }),

                // ── MAINTENANCE TOOLS ────────────────────────────────────────────────
                get_equipment_status: tool({
                    description: "Get the maintenance status of kitchen equipment and appliances.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { alerts: [], systemStatus: "Maintenance module not connected." };
                        return {
                            alerts: [
                                { name: "Pitco Fryer #2", status: "BROKEN", urgent: true },
                                { name: "Hobart Dishwasher", status: "NEEDS_MAINTENANCE", urgent: true }
                            ],
                            systemStatus: "Critical systems require attention. You can automatically dispatch tech via Email from the Maintenance Dashboard."
                        };
                    },
                }),

                // ── LOGBOOK TOOLS ────────────────────────────────────────────────────
                get_shift_logs: tool({
                    description: "Get recent shift logs, manager handover notes, and daily recaps.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantName?.toLowerCase() !== "meyhouse") return { aiRecap: "No shift logs found.", actionItems: "Start logging shift handovers in the Maintenance & Logs dashboard." };
                        return {
                            aiRecap: "Excellent health inspection (98) yesterday morning. Evening rush caused a draft IPA stockout. Today began with a vendor issue (late delivery, rejected tomatoes).",
                            actionItems: "Follow up on tomato credit, update 86 list for IPA, and ensure grill cooks run hood fans on high during peak."
                        };
                    },
                }),

                // ── SOCIAL MEDIA & REVIEWS TOOLS ────────────────────────────────────
                analyze_social_reviews: tool({
                    description: "Get recent social media and dining reviews from Google, Yelp, and OpenTable. Analyze sentiment and show what customers are saying.",
                    parameters: z.object({}),
                    execute: async () => {
                        const reviews = getRecentReviews(restaurantName);
                        const stats = getReviewStats(restaurantName);

                        if (reviews.length === 0) {
                            return {
                                message: "No recent reviews found yet. Make sure your Google Business, Yelp, and OpenTable accounts are connected in the Integrations dashboard."
                            };
                        }

                        return {
                            stats,
                            latestReviews: reviews.map(r => ({
                                platform: r.platform,
                                rating: `⭐ ${r.rating}/5`,
                                author: r.author,
                                sentiment: r.sentiment.toUpperCase(),
                                excerpt: `"${r.text}"`,
                                when: r.date
                            })),
                            aiSummary: restaurantName.toLowerCase() === "meyhouse"
                                ? "The 'Truffle Burger' and 'Spicy Marg' are driving highly positive sentiment across Google and OpenTable. However, there is a recurring complaint on Yelp about hostess stand bottlenecks and wait times."
                                : "No clear sentiment trends yet. Keep gathering reviews!"
                        };
                    },
                }),

                // ── CALIFORNIA COMPLIANCE & TRAINING TOOLS ──────────────────────────
                get_ca_compliance_info: tool({
                    description: "Provide CA State rules for Food & Beverage and Alcohol (RBS) and how to schedule on-site training. Note: This feature is only available for Pro/Enterprise plans.",
                    parameters: z.object({}),
                    execute: async () => {
                        if (restaurantPlan === "trial" || restaurantPlan === "starter") {
                            return {
                                accessStatus: "DENIED",
                                message: "⚠️ The California Compliance & On-Site Training module is exclusive to our Pro and Enterprise plans. Please upgrade via Settings to access state regulations, AI quiz generation, and book your free on-site training."
                            }
                        }

                        return {
                            accessStatus: "GRANTED",
                            caRulesV2026: {
                                foodHandler: "All staff prepping/serving food must have a valid CA Food Handler Card within 30 days of hire. Restly syncs certification expiration dates in the Staff Dashboard.",
                                alcoholRBS: "All managers and servers pouring alcohol MUST be RBS Certified (Responsible Beverage Service) under CA AB-1221.",
                                requiredPosters: "Restaurants must display updated Minimum Wage, Cal/OSHA, and 'Wash Your Hands' posters in common areas."
                            },
                            onSiteTrainingInfo: "As a Pro member, you receive 1 free on-site CA compliance training session per year (max 20 staff). AI will simulate a health inspector walkthrough. Say 'Schedule my on-site training' and I will dispatch an agent."
                        };
                    },
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("OpenAI API Error:", error.message);
        return new Response("I'm sorry, my API quota limit has been reached, so I cannot process your request. Please top up your OpenAI API balance.", { status: 500 });
    }
}
