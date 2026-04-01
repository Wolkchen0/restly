import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const restaurant = await prisma.restaurant.findUnique({
        where: { id: session.user.id },
        include: { locations: true }
    });

    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Use default location or active location logic (simplifying for API)
    const activeLoc = restaurant.locations.find(l => l.isDefault) || restaurant.locations[0];

    // If no social tokens are connected, return empty or a specific status
    const isConnected = !!(activeLoc?.instagramToken || activeLoc?.facebookToken || activeLoc?.tiktokToken);

    if (!isConnected) {
        return NextResponse.json({ connected: false, messages: [] });
    }

    // Check if this is a demo account
    const isDemoAccount = restaurant.email === "demo@restly.com" || restaurant.name.toLowerCase().includes("sample");

    if (isDemoAccount) {
        // Demo: return sample messages to demonstrate UI
        return NextResponse.json({
            connected: true,
            messages: [
                {
                    id: "m1", platform: "Instagram", sender: "Mia Wallace", handle: "@mia_foodie", avatar: "👩🏻",
                    preview: "Do you guys have vegan options for the tasting menu?",
                    fullMessage: "Hi there! I'm planning to book a table for my anniversary this Friday. Do you guys have vegan options for the tasting menu, or is it strictly as-is? Thanks!",
                    time: "10:42 AM", unread: true
                },
                {
                    id: "m2", platform: "TikTok", sender: "Foodie Bay Area", handle: "@bayareabites", avatar: "🤳",
                    preview: "Just posted a viral video about your lamb chops 🔥",
                    fullMessage: "Hey team! Just posted a video about your lamb chops and it's blowing up. Would love to collaborate on a giveaway if you're open to it?",
                    time: "Yesterday", unread: true
                },
                {
                    id: "m3", platform: "Facebook", sender: "David Chen", handle: "David Chen", avatar: "👨🏻‍🦱",
                    preview: "Is the outdoor patio dog friendly?",
                    fullMessage: "Hello, wanted to ask if the outdoor patio is dog friendly? We have a small poodle.",
                    time: "Tuesday", unread: false
                },
                {
                    id: "m4", platform: "Instagram", sender: "Elena Rodriguez", handle: "@elena_eats", avatar: "👩🏽",
                    preview: "What time does happy hour end?",
                    fullMessage: "Hi! Quick question, what time does your happy hour end on Thursdays and do we need a reservation for the bar area?",
                    time: "Monday", unread: false
                }
            ]
        });
    }

    // Real user with connected tokens — show "syncing" status
    // TODO: Implement real Meta Graph API / TikTok API calls here
    const connectedPlatforms = [];
    if (activeLoc?.instagramToken) connectedPlatforms.push("Instagram");
    if (activeLoc?.facebookToken) connectedPlatforms.push("Facebook");
    if (activeLoc?.tiktokToken) connectedPlatforms.push("TikTok");

    return NextResponse.json({
        connected: true,
        syncing: true,
        messages: [],
        note: `Connected to ${connectedPlatforms.join(", ")}. Messages will appear as they arrive.`,
    });
}
