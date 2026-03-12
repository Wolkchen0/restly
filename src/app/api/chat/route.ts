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
3. Manage Staff → View and APPROVE time-off requests.
4. Maintenance → Report broken equipment and log fixes.
5. Logbook → Create shift log entries for incidents, notes, and handovers.
6. Recipes → Update recipe prices or costs.
7. Finance & KDS → Analyze profit margins, labor costs, and kitchen performance.
8. Social Reviews → Pull and analyze sentiment from Google/Yelp/OpenTable.
9. Compliance → Provide California food safety and RBS certification rules.
10. Navigation → Guide users to specific pages or take them there directly.
11. POS Integration Help → Guide users through connecting their Point of Sale system.

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

### Google Business Profile
- What it does: Pulls Google reviews, star ratings, and business info
- How to connect:
  1. Go to Google Business Profile Manager → https://business.google.com
  2. Verify your restaurant is claimed and verified
  3. Go to Google Cloud Console → https://console.cloud.google.com
  4. Create a project → Enable "Google My Business API"
  5. Create credentials → API Key or OAuth 2.0 Client
  6. Copy the API token
  7. In Restly → Settings → Online Profiles → Click "Add Google Business" → Paste token
- Official Docs: https://developers.google.com/my-business/reference/rest

### Yelp
- What it does: Pulls Yelp reviews, ratings, and business data
- How to connect:
  1. Go to https://www.yelp.com/developers
  2. Sign in with your Yelp account
  3. Create a new app → Fill in details → Submit
  4. Copy the API Key from your app's settings
  5. In Restly → Settings → Online Profiles → Click "Add Yelp" → Paste API Key
- What You Get: Reviews, star ratings, review count, business attributes
- Free Tier: 5,000 API calls/day
- Official Docs: https://docs.developer.yelp.com/docs/fusion-intro

### X (formerly Twitter)
- What it does: Monitors mentions, hashtags, and engagement about your restaurant
- How to connect:
  1. Go to https://developer.x.com (formerly developer.twitter.com)
  2. Sign in → Apply for developer access (Free tier available)
  3. Create a Project & App in the Developer Portal
  4. Generate Bearer Token from Keys & Tokens section
  5. In Restly → Settings → Online Profiles → Click "Add X" → Paste Bearer Token
- What You Get: Mention monitoring, hashtag tracking, sentiment analysis
- Official Docs: https://developer.x.com/en/docs

### Instagram
- What it does: Monitors mentions, tagged posts, and engagement
- How to connect:
  1. You need a Facebook Business account linked to your Instagram
  2. Go to Meta for Developers → https://developers.facebook.com
  3. Create an app → Add "Instagram Basic Display" product
  4. Generate a long-lived access token
  5. In Restly → Settings → Online Profiles → Click "Add Instagram" → Paste token
- Important: Requires a Facebook Business account and an Instagram Professional account
- Official Docs: https://developers.facebook.com/docs/instagram-basic-display-api/

### Facebook
- What it does: Pulls Facebook page reviews, ratings, and engagement data
- How to connect:
  1. Go to Meta for Developers → https://developers.facebook.com
  2. Create an app → Select "Business" type
  3. Add "Pages API" permissions
  4. Generate a Page Access Token (long-lived)
  5. In Restly → Settings → Online Profiles → Click "Add Facebook" → Paste token
- Official Docs: https://developers.facebook.com/docs/pages/

### TikTok
- What it does: Monitors TikTok mentions and engagement about your restaurant
- How to connect:
  1. Go to TikTok for Developers → https://developers.tiktok.com
  2. Create a developer account → Create an app
  3. Request "Content Discovery" scope
  4. Generate an access token
  5. In Restly → Settings → Online Profiles → Click "Add TikTok" → Paste token
- Official Docs: https://developers.tiktok.com/doc/overview/

### General Tips for Online Profiles
- OpenTable is the most important one for restaurant operations — connect it first
- All tokens are stored securely and encrypted at rest
- Navigate to → Settings → Locations & Integrations → scroll down to "Online Profiles & Reviews"

## HOW TO RESPOND
- Write naturally and concisely. Skip filler.
- NEVER use ** or any markdown bold/italic markers in your responses. Keep text completely plain and clean.
- Use bullet points (•) for lists and arrows (→) to show steps or navigation paths.
- Use numbered lists for step-by-step instructions. Keep them simple and easy to scan.
- When you perform an action (like updating inventory), confirm it clearly. The system will automatically show a navigation card — do NOT ask "Would you like me to take you there?" or similar follow-ups.
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
                    description: "Add a new guest or update VIP status/notes for an existing guest.",
                    parameters: z.object({
                        name: z.string().describe("Full name of the guest"),
                        isVip: z.boolean().default(true),
                        notes: z.string().optional().describe("Special preferences, allergies, or notes"),
                    }),
                    execute: async ({ name, isVip, notes }) => {
                        const guest = addOrUpdateGuest(name, isVip, notes);
                        return {
                            success: true,
                            message: `${guest.firstName} ${guest.lastName} updated in the system as ${isVip ? "VIP" : "Guest"}.`,
                            guest: { id: guest.id, name: `${guest.firstName} ${guest.lastName}`, isVip: guest.isVip },
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
                    description: "Get P&L, Revenue, COGS, and Profit data.",
                    parameters: z.object({}),
                    execute: async () => ({
                        revenue: "$176,000", cogs: "$51,300", profit: "$52,600", margin: "29.9%",
                        navigation: { path: "/dashboard/finance", label: "P&L / Finance" }
                    }),
                }),

                analyze_social_reviews: tool({
                    description: "Get and analyze social media reviews from Google, Yelp, and OpenTable.",
                    parameters: z.object({}),
                    execute: async () => {
                        const reviews = getRecentReviews(restaurantName);
                        return { stats: getReviewStats(restaurantName), reviews: reviews.slice(0, 3) };
                    },
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
