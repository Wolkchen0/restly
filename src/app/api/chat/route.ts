import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { searchGuests, getVipGuests, getTodayReservations, addOrUpdateGuest } from "@/services/opentable";
import { getInventory, getLowStockItems, getInventoryStats } from "@/services/toast";
import { getAllTimeOffRequests } from "@/services/timeoff";
import { getRecentReviews, getReviewStats } from "@/services/reviews";
import { BOTTLE_INVENTORY, DRINK_RECIPES } from "@/services/drinks";
import { FOOD_INGREDIENTS, FOOD_RECIPES, getFoodCost, getFoodServingsRemaining } from "@/services/food-recipes";

export const maxDuration = 30;
const AI_MODEL = "gpt-4o-mini";

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new Response("Unauthorized", { status: 401 });

    // Read API key at request time (critical for Vercel serverless)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("OPENAI_API_KEY is not set in environment variables");
        return new Response("AI configuration error. OPENAI_API_KEY missing.", { status: 500 });
    }

    const openai = createOpenAI({ apiKey });

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
            system: `You are Restly AI — the intelligent restaurant manager assistant for ${restaurantName}.

Today is ${today} at ${timeNow} (California). Current plan: ${restaurantPlan}.

## YOUR CAPABILITIES
You are NOT just a chatbot — you are an active operations manager. You can:
1. Manage Inventory → Check stock, search items, AND update levels. (e.g. "Add 10 lbs of Wagyu")
2. Manage Guests → Look up guests AND mark them as VIP or add notes. (e.g. "Make Ihsan a VIP")
3. Manage Staff → View and APPROVE time-off requests, check the weekly schedule, and see who's working today.
4. Maintenance → Report broken equipment, check equipment status/warranty/service contacts.
5. Logbook → Create AND read shift log entries for incidents, notes, and handovers.
6. Recipes → Read and update food and drink recipes with costs, margins, and ingredients.
7. Finance → Analyze profit margins, labor costs, COGS, and P&L with daily/weekly/monthly breakdowns.
8. Kitchen (KDS) → Check live ticket times, station bottlenecks, and throughput data.
9. Team Performance → Get staff leaderboard with sales, tips, check averages, and upsell rates.
10. Social Reviews → Pull and analyze sentiment from Google/Yelp/OpenTable.
11. Inbox → Check emails, social mentions, and review alerts.
12. Compliance → Provide California food safety and RBS certification rules.
13. Navigation → Guide users to specific pages or take them there directly.
14. POS Integration Help → Guide users through connecting their Point of Sale system.

## POS INTEGRATION KNOWLEDGE
When users ask about connecting their POS, give them exact steps. Here is the official info:

### Toast POS (Standard API Access — No Partner Approval Needed)
- Requirements: Active Toast RMS Essentials subscription + "Manage Integrations" permission
- Steps:
  1. Log in to Toast Web (your regular Toast admin portal)
  2. Go to Integrations → Toast API access → Manage credentials
  3. Click "Create credentials"
  4. Select the locations you want to grant access to
  5. Select scopes (orders:read, menus:read, stock:read, labor:read, etc.)
  6. Copy the Client ID and Client Secret
  7. In Restly → Settings → Select Toast POS → Paste Client ID, Client Secret, and Restaurant GUID → Click Connect
- Restaurant GUID: Found in Toast Web → Admin → Restaurant Info, or in the URL bar when logged in
- What You Get: Read access to orders, menus, stock, employees, kitchen data, cash, guests
- Limitations: Read-only (no writing back to Toast), no sandbox
- Official Docs: https://doc.toasttab.com/doc/devguide/devApiAccessCredentials.html

### Square (Easiest — Instant Setup)
- Steps:
  1. Go to https://developer.squareup.com/apps
  2. Sign in with your Square account (or create one)
  3. Click "+ New Application" → name it (e.g. "Restly Integration")
  4. Go to the Credentials tab → Switch to "Production"
  5. Copy the Production Access Token (starts with EAAA...)
  6. For Location ID → Go to Square Dashboard → Locations → Copy the Location ID
  7. In Restly → Settings → Select Square → Paste Access Token & Location ID → Click Connect
- What You Get: Full read/write access to orders, payments, customers, inventory, catalog, team
- Official Docs: https://developer.squareup.com/docs/build-basics/access-tokens

### Clover
- Steps:
  1. Log in to your Clover Merchant Dashboard (the web portal, not the POS device)
  2. Go to Settings → API Tokens (under Business Operations)
  3. Click "Create new token" → Name it → Select permissions
  4. Copy the generated API token
  5. Your Merchant ID is in the URL bar of the dashboard (the string after /merchants/)
  6. In Restly → Settings → Select Clover → Paste API Token & Merchant ID → Click Connect
- Important: For production, Clover uses OAuth 2.0 — the merchant's API token must have correct permissions
- API Base URL: https://api.clover.com/v3/merchants/{merchantId}
- Official Docs: https://docs.clover.com/docs/generate-a-test-api-token

### Lightspeed
- Steps:
  1. Go to Lightspeed Developer Portal (register if needed)
  2. Create an API Client → Get Client ID & Client Secret
  3. Uses OAuth 2.0: Authorization code → Exchange for access token + refresh token
  4. Access token expires after 1 hour; use refresh token to get new ones
  5. In Restly → Settings → Select Lightspeed → Paste Client ID & Secret → Click Connect
- Note: Requires approved partner OR direct merchant access. Have your Account Manager enable API access.
- Official Docs: https://developers.lightspeedhq.com/restaurant/authentication/authentication-overview/

### Revel Systems
- Steps:
  1. Contact Revel support to request API credentials
  2. You'll receive Client ID & Client Secret via automated email
  3. Your Establishment ID is in the Revel Management Console
  4. Auth: Uses Bearer token via POST with Client ID & Secret
  5. Set Client-Id header from your Revel URL (e.g., for "myrestaurant.revelup.com" → Client-Id = "myrestaurant")
  6. In Restly → Settings → Select Revel → Paste API Key, Secret, & Establishment ID → Click Connect
- API Base URL: https://api.revelsystems.com/
- Token Refresh: Generate new token every 24 hours
- Official Docs: https://developer.revelsystems.com/

### General POS Tips
- All credentials are encrypted and never shared
- If connection fails, double-check credentials and try the "Retry" button
- You can always click "Need help? Get API Key →" next to any POS for direct links
- Navigate to Settings page → Locations & Integrations → POS Integration

## ONLINE PROFILES & REVIEWS KNOWLEDGE
When users ask about connecting review platforms or social media, give them exact steps.

### OpenTable (Priority — Most Important for Restaurants)
- What it does: Pulls reservation data, guest profiles, dining history, and reviews
- How to connect:
  1. Log in to your OpenTable Restaurant Center at https://restaurant.opentable.com
  2. Go to Settings → Integrations → API Access
  3. Copy your Restaurant ID (also visible in your OpenTable URL)
  4. In Restly → Settings → Online Profiles → Click "Connect OpenTable Restaurant ID" → Paste your ID
- What You Get: Reservation sync, guest visit history, VIP identification, review monitoring
- Official Docs: https://platform.opentable.com/documentation/


### Instagram + Facebook (SAME API — Meta Graph API)
IMPORTANT: Instagram and Facebook use the SAME Meta developer platform. ONE token works for BOTH.
- Direct link to create an app: https://developers.facebook.com/apps/creation/
- How to connect:
  1. Go to https://developers.facebook.com/apps/creation/ and click "Create App"
  2. Choose "Business" app type → Next
  3. Enter app name (e.g. "Restly") → Create App
  4. In the app dashboard, click "Add Product" → Add "Instagram Graph API" AND "Facebook Login"
  5. Go to Tools → Graph API Explorer (https://developers.facebook.com/tools/explorer/)
  6. Select your app from the dropdown
  7. Click "Generate Access Token" → Select permissions: pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_insights
  8. Click "Generate" → Copy the access token (starts with "EAA...")
  9. IMPORTANT: This is a short-lived token (1hr). To make it long-lived:
     → Go to https://developers.facebook.com/tools/debug/accesstoken/
     → Paste your token → Click "Extend Access Token" → Copy the new long-lived token
  10. In Restly → Settings → Online Profiles → Add Instagram with this token AND Add Facebook with the SAME token
- What You Get: Instagram mentions, tagged posts, stories, Facebook page reviews, ratings, engagement
- Official Docs: https://developers.facebook.com/docs/instagram-api/
- Token Debug Tool: https://developers.facebook.com/tools/debug/accesstoken/

### Google Business Profile
- What it does: Pulls Google reviews, star ratings, and business info
- Direct link: https://console.cloud.google.com/apis/credentials
- How to connect:
  1. Go to https://console.cloud.google.com/projectcreate → Create a new project (name: "Restly")
  2. Go to APIs & Services → Enable APIs → Search "Google My Business API" → Enable it
  3. Go to https://console.cloud.google.com/apis/credentials → Click "Create Credentials" → "API Key"
  4. Copy the API key (starts with "AIza...")
  5. IMPORTANT: Restrict the key → API restrictions → select only "Google My Business API"
  6. In Restly → Settings → Online Profiles → Click "Add Google Business" → Paste API key
- Official Docs: https://developers.google.com/my-business/reference/rest

### Yelp
- What it does: Pulls Yelp reviews, ratings, and business data
- Direct link to create app: https://www.yelp.com/developers/v3/manage_app
- How to connect:
  1. Go to https://www.yelp.com/developers/v3/manage_app
  2. Sign in with your Yelp account (or create one)
  3. Fill in: App Name = "Restly", Industry = "Restaurants", Description = "Review monitoring"
  4. Click "Create New App"
  5. Copy the API Key from the app page (long string, 128+ characters)
  6. In Restly → Settings → Online Profiles → Click "Add Yelp" → Paste API Key
- Free Tier: 5,000 API calls/day
- Official Docs: https://docs.developer.yelp.com/docs/fusion-intro

### X (formerly Twitter)
- What it does: Monitors mentions, hashtags, and engagement about your restaurant
- Direct link: https://developer.x.com/en/portal/dashboard
- How to connect:
  1. Go to https://developer.x.com/en/portal/dashboard
  2. Sign in → Apply for developer access (Free tier available)
  3. Create a Project → Create an App within the project
  4. Go to "Keys and Tokens" → Generate "Bearer Token"
  5. Copy the Bearer Token
  6. In Restly → Settings → Online Profiles → Click "Add X" → Paste Bearer Token
- Official Docs: https://developer.x.com/en/docs

### TikTok
- What it does: Monitors TikTok mentions and viral content about your restaurant
- Direct link: https://developers.tiktok.com/apps/
- How to connect:
  1. Go to https://developers.tiktok.com/apps/
  2. Create a developer account → Create an app
  3. Request "Content Discovery" and "Video List" scopes → Submit for review
  4. Once approved, generate an access token from the app settings
  5. In Restly → Settings → Online Profiles → Click "Add TikTok" → Paste token
- Note: TikTok API requires app review which may take 1-3 business days
- Official Docs: https://developers.tiktok.com/doc/overview/

### General Tips for Online Profiles
- Instagram + Facebook use the SAME token (Meta Graph API) — connect both with one token
- OpenTable is the most important one for restaurant operations — connect it first
- All tokens are stored securely and encrypted at rest
- Navigate to → Settings → Locations & Integrations → scroll down to "Online Profiles & Reviews"
- ALWAYS provide direct links in your response that the user can click to go directly to the API page. Format links as: "Go to [URL]"

## HOW TO RESPOND
- Write naturally and concisely like ChatGPT. Skip filler and generic suggestions.
- NEVER use ** or any markdown bold/italic markers in your responses. Keep text completely plain and clean.
- Use bullet points (•) for lists and arrows (→) to show steps or navigation paths.
- Use numbered lists for step-by-step instructions. Keep them simple and easy to scan.
- ALWAYS include direct clickable URLs when explaining how to get API keys. Never just say "go to the developer portal" — give the exact URL.
- ALWAYS answer the user's question DIRECTLY with data. If they ask "what's my daily labor cost?", USE the get_financial_overview tool and give them the exact number. NEVER say "I don't have that information" or "you can check the P&L page" — you HAVE the tools to get the data, so USE them and respond with the answer.
- NEVER ask follow-up questions like "Would you like me to take you there?" or "Shall I do that?" — just answer or act.
- When you perform an action (like updating inventory), confirm it clearly. The system will automatically show a navigation card.
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
                    description: "Update inventory quantity or status. Use 'add' to increase, 'remove' to decrease, or 'set' to set absolute value. Works for bottles (e.g. Tito's, Grey Goose) and food items (e.g. flour, eggs, beef).",
                    parameters: z.object({
                        itemName: z.string().describe("Name of the inventory item (bottle or food ingredient)"),
                        quantity: z.number().describe("The quantity to add, remove, or set"),
                        action: z.enum(["add", "remove", "set"]).default("set"),
                        unit: z.string().optional().describe("Unit of measure (bottles, cases, lbs, etc.)"),
                        reason: z.string().optional().describe("Reason for adjustment (e.g. breakage, delivery, spillage)"),
                    }),
                    execute: async ({ itemName, quantity, action, unit, reason }) => {
                        // Check bottle inventory match
                        const bottle = BOTTLE_INVENTORY.find(b => b.name.toLowerCase().includes(itemName.toLowerCase()));
                        // Check food inventory match
                        const food = FOOD_INGREDIENTS.find(f => f.name.toLowerCase().includes(itemName.toLowerCase()));
                        const matchedItem = bottle ? `${bottle.name} (${bottle.fullBottles} full bottles + ${bottle.openBottleMl}ml open)` : food ? `${food.name} (${food.onHand} ${food.unit} on hand)` : itemName;
                        // Find affected recipes
                        const affectedRecipes = bottle
                            ? DRINK_RECIPES.filter(r => r.ingredients.some(i => i.spiritId === bottle.spiritId)).map(r => r.name)
                            : food
                            ? FOOD_RECIPES.filter(r => r.ingredients.some(i => i.inventoryId === food.inventoryId)).map(r => r.name)
                            : [];

                        return {
                            success: true,
                            message: `${action === "add" ? "Added" : action === "remove" ? "Removed" : "Set"} ${quantity}${unit ? " " + unit : ""} ${action === "remove" ? "from" : action === "add" ? "to" : "for"} ${matchedItem}.${reason ? " Reason: " + reason : ""}`,
                            affectedRecipes: affectedRecipes.length > 0 ? affectedRecipes : undefined,
                            navigation: { path: "/dashboard/inventory", label: "Inventory Dashboard" }
                        };
                    },
                }),

                get_full_inventory_details: tool({
                    description: "Get detailed breakdown of all bottle inventory (spirits, wine) and food ingredients with recipe connections, costs, and remaining servings.",
                    parameters: z.object({
                        category: z.enum(["bottles", "food", "all"]).default("all").describe("Filter by category")
                    }),
                    execute: async ({ category }) => {
                        const result: any = {};
                        if (category === "bottles" || category === "all") {
                            result.bottles = BOTTLE_INVENTORY.map(b => ({
                                name: b.name, fullBottles: b.fullBottles, openBottleMl: b.openBottleMl, sizeMl: b.sizeMl,
                                costPerBottle: b.costPerBottle,
                                usedIn: DRINK_RECIPES.filter(r => r.ingredients.some(i => i.spiritId === b.spiritId)).map(r => r.name),
                            }));
                        }
                        if (category === "food" || category === "all") {
                            result.food = FOOD_INGREDIENTS.map(f => {
                                const usedIn = FOOD_RECIPES.filter(r => r.ingredients.some(i => i.inventoryId === f.inventoryId));
                                return {
                                    name: f.name, onHand: f.onHand, unit: f.unit,
                                    costPerUnit: f.costPerUnit, supplier: f.supplier,
                                    usedIn: usedIn.map(r => r.name),
                                    servingsLeft: usedIn.length > 0 ? Math.min(...usedIn.map(r => getFoodServingsRemaining(r, FOOD_INGREDIENTS))) : null,
                                };
                            });
                        }
                        result.navigation = { path: "/dashboard/inventory", label: "Inventory Dashboard" };
                        return result;
                    },
                }),

                add_or_update_guest: tool({
                    description: "Add a new guest or update their info. Use this for dietary preferences, seating preferences, notes, AND/OR VIP status. IMPORTANT: Only set isVip if the user explicitly asks to make someone VIP. For dietary notes, use the dietaryNotes field with the specific restriction — do NOT assume 'vegan' if they just say 'no red meat'.",
                    parameters: z.object({
                        name: z.string().describe("Full name of the guest"),
                        isVip: z.boolean().optional().describe("Only set this if user explicitly wants to change VIP status. Leave undefined to keep current status unchanged."),
                        notes: z.string().optional().describe("General notes about the guest"),
                        dietaryNotes: z.string().optional().describe("Specific dietary restriction. Examples: 'No red meat', 'No pork', 'No shellfish', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'Nut allergy'. Use the EXACT restriction mentioned by the user, do NOT generalize."),
                        preferences: z.array(z.string()).optional().describe("Seating or service preferences, e.g. ['Window seat', 'Quiet table']"),
                    }),
                    execute: async ({ name, isVip, notes, dietaryNotes, preferences }) => {
                        const guest = addOrUpdateGuest(name, isVip, notes, dietaryNotes, preferences);
                        const updates: string[] = [];
                        if (isVip !== undefined) updates.push(isVip ? "marked as VIP" : "removed from VIP");
                        if (dietaryNotes) updates.push(`dietary: ${dietaryNotes}`);
                        if (notes) updates.push(`notes updated`);
                        if (preferences && preferences.length > 0) updates.push(`preferences: ${preferences.join(", ")}`);
                        const summary = updates.length > 0 ? updates.join(", ") : "profile updated";
                        return {
                            success: true,
                            message: `${guest.firstName} ${guest.lastName} — ${summary}.`,
                            guest: { id: guest.id, name: `${guest.firstName} ${guest.lastName}`, isVip: guest.isVip, dietaryNotes: guest.dietaryNotes },
                            navigation: { path: "/dashboard/guests", label: "Guest Intelligence" }
                        };
                    },
                }),

                approve_staff_timeoff: tool({
                    description: "Approve a pending staff time-off request.",
                    parameters: z.object({
                        employeeName: z.string(),
                        requestId: z.string(),
                    }),
                    execute: async ({ employeeName, requestId }) => ({
                        success: true,
                        message: `Approved time-off request #${requestId} for ${employeeName}.`,
                        navigation: { path: "/dashboard/schedule", label: "Staff Schedule" }
                    }),
                }),

                manage_equipment: tool({
                    description: "Report equipment failure or update maintenance status.",
                    parameters: z.object({
                        equipmentName: z.string(),
                        status: z.string().describe("New status, e.g. 'broken', 'fixed', 'needs inspection'"),
                        urgent: z.boolean().default(false),
                    }),
                    execute: async ({ equipmentName, status }) => ({
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
                    execute: async ({ category, note }) => ({
                        success: true,
                        message: `Logged ${category} note: "${note}".`,
                        navigation: { path: "/dashboard/logbook", label: "Shift Logbook" }
                    }),
                }),

                update_recipe_details: tool({
                    description: "Update the price or unit cost of a menu recipe.",
                    parameters: z.object({
                        recipeName: z.string(),
                        price: z.number().optional().describe("New selling price"),
                        cost: z.number().optional().describe("New ingredient cost"),
                    }),
                    execute: async ({ recipeName, price, cost }) => ({
                        success: true,
                        message: `Updated ${recipeName}: ${price ? "Price=$" + price : ""} ${cost ? "Cost=$" + cost : ""}.`.trim(),
                        navigation: { path: "/dashboard/recipes", label: "Chef & Recipes" }
                    }),
                }),

                // ── ANALYTICS TOOLS ────────────────────────────────────────────────
                get_financial_overview: tool({
                    description: "Get comprehensive P&L, Revenue, COGS, Labor Cost, and Profit data. Returns daily, weekly, and monthly breakdowns so you can answer ANY finance question directly.",
                    parameters: z.object({
                        period: z.enum(["today", "week", "month", "all"]).default("all").describe("Time period to get data for")
                    }),
                    execute: async ({ period }) => {
                        const daily = { revenue: 5867, cogs: 1710, labor: 1903, opex: 500 };
                        const dayOfWeek = new Date().getDay() || 7;
                        const dayOfMonth = new Date().getDate();

                        const periods: Record<string, any> = {
                            today: {
                                label: "Today",
                                revenue: daily.revenue, cogs: daily.cogs, labor: daily.labor, opex: daily.opex,
                                netProfit: daily.revenue - daily.cogs - daily.labor - daily.opex,
                            },
                            week: {
                                label: `Week-to-Date (${dayOfWeek} days)`,
                                revenue: daily.revenue * dayOfWeek, cogs: daily.cogs * dayOfWeek,
                                labor: daily.labor * dayOfWeek, opex: daily.opex * dayOfWeek,
                                netProfit: (daily.revenue - daily.cogs - daily.labor - daily.opex) * dayOfWeek,
                            },
                            month: {
                                label: `Month-to-Date (${dayOfMonth} days)`,
                                revenue: daily.revenue * dayOfMonth, cogs: daily.cogs * dayOfMonth,
                                labor: daily.labor * dayOfMonth, opex: daily.opex * dayOfMonth,
                                netProfit: (daily.revenue - daily.cogs - daily.labor - daily.opex) * dayOfMonth,
                            },
                        };

                        for (const p of Object.values(periods)) {
                            p.cogsPercent = p.revenue > 0 ? ((p.cogs / p.revenue) * 100).toFixed(1) + "%" : "0%";
                            p.laborPercent = p.revenue > 0 ? ((p.labor / p.revenue) * 100).toFixed(1) + "%" : "0%";
                            p.primeCostPercent = p.revenue > 0 ? (((p.cogs + p.labor) / p.revenue) * 100).toFixed(1) + "%" : "0%";
                            p.profitMargin = p.revenue > 0 ? ((p.netProfit / p.revenue) * 100).toFixed(1) + "%" : "0%";
                            p.revenue = "$" + p.revenue.toLocaleString();
                            p.cogs = "$" + p.cogs.toLocaleString();
                            p.labor = "$" + p.labor.toLocaleString();
                            p.opex = "$" + p.opex.toLocaleString();
                            p.netProfit = "$" + p.netProfit.toLocaleString();
                        }

                        const result = period === "all" ? periods : { [period]: periods[period] };
                        return {
                            ...result,
                            dailyAverages: {
                                revenue: "$" + daily.revenue.toLocaleString(),
                                cogs: "$" + daily.cogs.toLocaleString() + " (29.1%)",
                                labor: "$" + daily.labor.toLocaleString() + " (32.4%)",
                                opex: "$" + daily.opex.toLocaleString(),
                                netProfit: "$" + (daily.revenue - daily.cogs - daily.labor - daily.opex).toLocaleString(),
                            },
                            benchmarks: { cogTarget: "Under 30%", laborTarget: "25-33%", primeCostTarget: "Under 65%", profitMarginTarget: "10-15%" },
                            navigation: { path: "/dashboard/finance", label: "P&L / Finance" }
                        };
                    },
                }),

                analyze_social_reviews: tool({
                    description: "Get and analyze social media reviews from Google, Yelp, and OpenTable.",
                    parameters: z.object({}),
                    execute: async () => {
                        const reviews = getRecentReviews(restaurantName);
                        return { stats: getReviewStats(restaurantName), reviews: reviews.slice(0, 3) };
                    },
                }),

                // ── NEW: SCHEDULE & STAFF TOOLS ─────────────────────────────────────
                get_schedule_overview: tool({
                    description: "Get the weekly staff schedule, who is working today, shift coverage, and employee list with roles/departments.",
                    parameters: z.object({}),
                    execute: async () => {
                        const today = new Date();
                        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                        const todayName = dayNames[today.getDay()];
                        return {
                            currentDay: todayName,
                            staffList: [
                                { name: "Sarah Jenkins", role: "Sr. Server", department: "FOH" },
                                { name: "Marcus Torres", role: "Server / Barback", department: "FOH" },
                                { name: "Lisa Park", role: "Bartender", department: "Bar" },
                                { name: "David Chen", role: "Server", department: "FOH" },
                                { name: "Emily Watson", role: "Server", department: "FOH" },
                                { name: "Carlos Ramirez", role: "Jr. Server", department: "FOH" },
                                { name: "Chef Antonio", role: "Sous Chef", department: "Kitchen" },
                                { name: "Mike Rodriguez", role: "Line Cook", department: "Kitchen" },
                                { name: "Rosa Hernandez", role: "Pastry", department: "Kitchen" },
                                { name: "Jake Thompson", role: "Prep Cook", department: "Kitchen" },
                            ],
                            todayShifts: {
                                lunch: ["Chef Antonio", "Mike Rodriguez", "Sarah Jenkins", "David Chen"],
                                dinner: ["Chef Antonio", "Rosa Hernandez", "Jake Thompson", "Lisa Park", "Marcus Torres", "Emily Watson", "Carlos Ramirez"],
                            },
                            totalWeeklyHours: 340,
                            overtimeAlerts: ["Marcus Torres is at 42 hours this week (overtime threshold: 40)"],
                            navigation: { path: "/dashboard/schedule", label: "Schedule & Forms" }
                        };
                    },
                }),

                get_staff_performance: tool({
                    description: "Get staff performance leaderboard with sales, tips, check averages, turn times, and AI recommendations for each employee.",
                    parameters: z.object({
                        period: z.enum(["today", "month", "year"]).default("today")
                    }),
                    execute: async ({ period }) => {
                        const data: Record<string, any[]> = {
                            today: [
                                { rank: 1, name: "Lisa Park", role: "Bartender", totalSales: 1420, checkAvg: 102, tipPct: 26.5, upsellRate: 82, trend: "up" },
                                { rank: 2, name: "Sarah Jenkins", role: "Sr. Server", totalSales: 1180, checkAvg: 90, tipPct: 23.0, upsellRate: 72, trend: "up" },
                                { rank: 3, name: "Marcus Torres", role: "Server", totalSales: 960, checkAvg: 74, tipPct: 20.5, upsellRate: 58, trend: "up" },
                                { rank: 4, name: "David Chen", role: "Server", totalSales: 620, checkAvg: 62, tipPct: 16.8, upsellRate: 25, trend: "flat" },
                                { rank: 5, name: "Emily Watson", role: "Server", totalSales: 480, checkAvg: 60, tipPct: 15.2, upsellRate: 20, trend: "down" },
                            ],
                            month: [
                                { rank: 1, name: "Sarah Jenkins", role: "Sr. Server", totalSales: 18500, checkAvg: 85, tipPct: 22.4, upsellRate: 68, trend: "up" },
                                { rank: 2, name: "Marcus Torres", role: "Server", totalSales: 16200, checkAvg: 72, tipPct: 19.8, upsellRate: 52, trend: "up" },
                                { rank: 3, name: "Lisa Park", role: "Bartender", totalSales: 14800, checkAvg: 95, tipPct: 24.1, upsellRate: 74, trend: "flat" },
                                { rank: 4, name: "David Chen", role: "Server", totalSales: 12100, checkAvg: 68, tipPct: 18.5, upsellRate: 31, trend: "down" },
                                { rank: 5, name: "Emily Watson", role: "Server", totalSales: 9400, checkAvg: 65, tipPct: 17.2, upsellRate: 28, trend: "flat" },
                            ],
                            year: [
                                { rank: 1, name: "Marcus Torres", role: "Server", totalSales: 212000, checkAvg: 68, tipPct: 19.2, upsellRate: 55, trend: "up" },
                                { rank: 2, name: "Sarah Jenkins", role: "Sr. Server", totalSales: 208500, checkAvg: 82, tipPct: 21.8, upsellRate: 70, trend: "up" },
                                { rank: 3, name: "Lisa Park", role: "Bartender", totalSales: 185000, checkAvg: 92, tipPct: 23.5, upsellRate: 76, trend: "up" },
                            ],
                        };
                        return {
                            period,
                            leaderboard: data[period] || data.today,
                            teamAvgCheckAvg: "$" + Math.round((data[period] || data.today).reduce((a: number, s: any) => a + s.checkAvg, 0) / (data[period] || data.today).length),
                            teamAvgTipPct: ((data[period] || data.today).reduce((a: number, s: any) => a + s.tipPct, 0) / (data[period] || data.today).length).toFixed(1) + "%",
                            navigation: { path: "/dashboard/team", label: "Team Performance" }
                        };
                    },
                }),

                // ── NEW: KDS TOOL ───────────────────────────────────────────────────
                get_kds_status: tool({
                    description: "Get current Kitchen Display System status: live ticket times, station bottleneck data, longest ticket, average ticket time, and throughput.",
                    parameters: z.object({}),
                    execute: async () => ({
                        avgTicketTime: "18m 30s",
                        longestTicket: "28m 05s (T-8902, Table 14 — 2x Ribeye M, 1x Caesar, 1x Truffle Fries)",
                        openTickets: 14,
                        throughput: "42 plates/hr",
                        stationBottlenecks: [
                            { station: "Grill", avgTime: "24m", load: "85%", status: "BOTTLENECK" },
                            { station: "Fryer", avgTime: "12m", load: "90%", status: "HIGH" },
                            { station: "Expo", avgTime: "4m", load: "95%", status: "HIGH" },
                            { station: "Saute", avgTime: "18m", load: "60%", status: "OK" },
                            { station: "Garde Manger", avgTime: "8m", load: "40%", status: "OK" },
                        ],
                        lateTickets: [
                            { id: "T-8902", table: "14", server: "Lisa P.", time: "28m", status: "LATE", items: "2x Ribeye (M), 1x Caesar, 1x Truffle Fries" },
                            { id: "T-8903", table: "22", server: "Carlos R.", time: "18m", status: "WARNING", items: "1x Salmon, 1x Vegan Bowl" },
                        ],
                        aiRecommendation: "Grill station averaging 24m/ticket (target 15m). Recommend shifting a prep cook to Grill line or 86ing well-done steaks.",
                        navigation: { path: "/dashboard/kds", label: "Kitchen Performance" }
                    }),
                }),

                // ── NEW: LOGBOOK TOOL ───────────────────────────────────────────────
                get_logbook_entries: tool({
                    description: "Get recent shift logbook entries with dates, managers, tags, and notes. Use this to check past shift notes, incidents, or handover messages.",
                    parameters: z.object({}),
                    execute: async () => ({
                        entries: [
                            { date: "2026-03-05", shift: "AM", manager: "Sarah J.", notes: "Health inspector passed (98/100). Need more degreaser. Slow lunch ~$1,400.", tags: ["Audit", "Slow"] },
                            { date: "2026-03-05", shift: "PM", manager: "Mark T.", notes: "Bar slammed (game night). Ran out of draft IPA by 9 PM. Fire alarm tripped 1 min. Sales: $8,500.", tags: ["Busy", "Inventory Incident"] },
                            { date: "2026-03-06", shift: "AM", manager: "Sarah J.", notes: "Produce delivery late 2hrs. Tomatoes bad, sent back 2 cases. Refund requested.", tags: ["Vendor", "Quality Issue"] },
                            { date: "2026-03-11", shift: "AM", manager: "Sarah J.", notes: "Hobart Dishwasher acting up, loud noise, not draining. Might be broken.", tags: ["Maintenance", "Urgent"] },
                        ],
                        totalEntries: 4,
                        navigation: { path: "/dashboard/logbook", label: "Shift Logbook" }
                    }),
                }),

                // ── NEW: EQUIPMENT TOOL ─────────────────────────────────────────────
                get_equipment_status: tool({
                    description: "Get all equipment with status, model, serial, warranty, next service date, and service contact info. Use this to answer questions about equipment health, warranties, or service schedules.",
                    parameters: z.object({}),
                    execute: async () => ({
                        equipment: [
                            { name: "Walk-in Cooler (Main)", status: "OK", model: "Kolpak QS7-1010-FT", serial: "KP-2023-44891", warranty: "2027-08-15", nextService: "2026-05-15", servicePhone: "+1 (800) 555-2671", notes: "Runs at 34F avg." },
                            { name: "Hobart Dishwasher", status: "NEEDS_MAINTENANCE", urgent: true, model: "Hobart AM15-6", serial: "HB-2024-77342", warranty: "2028-01-20", nextService: "2026-03-10", servicePhone: "+1 (800) 555-4482", notes: "Loud noise, not draining." },
                            { name: "Pitco Fryer #2", status: "BROKEN", urgent: true, model: "Pitco SSH75R", serial: "PT-2022-55190", warranty: "Expired (2025-06)", servicePhone: "+1 (800) 555-9103", notes: "Thermostat failure, oil not heating past 280F." },
                            { name: "Ice Machine (Bar)", status: "OK", model: "Manitowoc IYT0620A", serial: "MW-2024-33215", warranty: "2028-04-10", nextService: "2026-06-01", servicePhone: "+1 (800) 555-7744", notes: "575 lbs/day capacity." },
                        ],
                        summary: { total: 4, ok: 2, needsMaintenance: 1, broken: 1 },
                        navigation: { path: "/dashboard/maintenance", label: "Equipment & Maintenance" }
                    }),
                }),

                // ── NEW: RECIPE READ TOOL ───────────────────────────────────────────
                get_recipe_details: tool({
                    description: "Get detailed recipe information including food recipes and drink/cocktail recipes with ingredients, costs, margins, and menu prices.",
                    parameters: z.object({
                        type: z.enum(["food", "drinks", "all"]).default("all").describe("Type of recipes to retrieve")
                    }),
                    execute: async ({ type }) => {
                        const result: any = {};
                        if (type === "food" || type === "all") {
                            result.foodRecipes = FOOD_RECIPES.map(r => {
                                const cost = getFoodCost(r, FOOD_INGREDIENTS);
                                const margin = r.menuPrice > 0 ? Math.round(((r.menuPrice - cost) / r.menuPrice) * 100) : 0;
                                return {
                                    name: r.name, menuPrice: "$" + r.menuPrice, foodCost: "$" + cost.toFixed(2),
                                    margin: margin + "%", category: r.category,
                                    ingredients: r.ingredients.map(i => {
                                        const item = FOOD_INGREDIENTS.find(f => f.inventoryId === i.inventoryId);
                                        return item ? `${item.name} (${i.amount} ${i.unit})` : i.inventoryId;
                                    }),
                                };
                            });
                        }
                        if (type === "drinks" || type === "all") {
                            result.drinkRecipes = DRINK_RECIPES.map(r => {
                                let pourCost = 0;
                                for (const ing of r.ingredients) {
                                    const bot = BOTTLE_INVENTORY.find(b => b.spiritId === ing.spiritId);
                                    if (bot) pourCost += (ing.amountMl / bot.sizeMl) * bot.costPerBottle;
                                }
                                const margin = r.menuPrice > 0 ? Math.round(((r.menuPrice - pourCost) / r.menuPrice) * 100) : 0;
                                return {
                                    name: r.name, menuPrice: "$" + r.menuPrice, pourCost: "$" + pourCost.toFixed(2),
                                    margin: margin + "%", category: r.category,
                                    ingredients: r.ingredients.map(i => {
                                        const bot = BOTTLE_INVENTORY.find(b => b.spiritId === i.spiritId);
                                        return bot ? `${bot.name} (${i.amountMl}ml)` : i.spiritId;
                                    }),
                                };
                            });
                        }
                        result.navigation = { path: "/dashboard/recipes", label: "Chef & Recipes" };
                        return result;
                    },
                }),

                // ── NEW: INBOX TOOL ─────────────────────────────────────────────────
                get_inbox_summary: tool({
                    description: "Get inbox summary including unread email count, recent social mentions, and review alerts.",
                    parameters: z.object({}),
                    execute: async () => ({
                        emails: { total: 6, unread: 3, recentSenders: ["Jennifer Oaks", "David Kim", "Restaurant Depot", "Southern Glazer's", "Sarah Martinez", "OpenTable Notifications"] },
                        socialMentions: { total: 8, positive: 5, neutral: 2, negative: 1, platforms: ["Instagram", "X/Twitter", "TikTok", "Google News"] },
                        reviewAlerts: { newReviews: 3, avgRating: 4.2, platformBreakdown: { google: 4.3, yelp: 4.0, opentable: 4.4 } },
                        navigation: { path: "/dashboard/inbox", label: "Social Inbox" }
                    }),
                }),

                navigate_to: tool({
                    description: "Guide user to a specific dashboard page.",
                    parameters: z.object({
                        destination: z.enum(["overview", "settings", "guests", "inventory", "schedule", "finance", "kds", "recipes", "maintenance", "logbook", "inbox", "team"]),
                    }),
                    execute: async ({ destination }) => {
                        const paths: Record<string, string> = {
                            overview: "/dashboard",
                            settings: "/dashboard/settings",
                            guests: "/dashboard/guests",
                            inventory: "/dashboard/inventory",
                            schedule: "/dashboard/schedule",
                            finance: "/dashboard/finance",
                            kds: "/dashboard/kds",
                            recipes: "/dashboard/recipes",
                            maintenance: "/dashboard/maintenance",
                            logbook: "/dashboard/logbook",
                            inbox: "/dashboard/inbox",
                            team: "/dashboard/team",
                        };
                        return {
                            success: true,
                            message: `Navigating to ${destination}...`,
                            navigation: { path: paths[destination] || "/dashboard", label: destination.charAt(0).toUpperCase() + destination.slice(1) },
                        };
                    },
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error:", error?.message || error);
        console.error("Error type:", error?.constructor?.name);
        if (error?.status) console.error("API status:", error.status);
        const msg = error?.message?.includes("API key")
            ? "AI configuration error. Please check API key."
            : "AI service error. Please try again.";
        return new Response(msg, { status: 500 });
    }
}
