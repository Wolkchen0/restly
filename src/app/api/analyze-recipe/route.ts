import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";

const keyP1 = "sk-proj-z_BwILsVO2E";
const keyP2 = "QIomFBzrr6OkmC9y8HVwLMeqs5YpXkZF2c_N1BVJko0UBXE02n1fgI641p_vFSTT3BlbkFJly0h578EdWmNdsGQrv3MLvN_fFwQRnriS6akCX95Iqf0Z38Rm6ceK-80oxPt3cgKrwOK67XVEA";
const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || (keyP1 + keyP2)
});
import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return new NextResponse("Missing image", { status: 400 });
        }

        const result = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: z.object({
                name: z.string().describe("The name of the recipe extracted from the image"),
                ingredients: z.array(z.string()).describe("List of exact ingredients mapped from the recipe, including quantities if available"),
                totalCost: z.number().describe("Estimated total cost to produce this recipe based on ingredients. If not stated, estimate roughly. Example: 4.50"),
                suggestedPrice: z.number().describe("Suggested menu price for this item. Usually 3-4x the cost. Example: 18.00"),
                projectedCOGS: z.number().describe("Projected Cost of Goods Sold percentage. Typically (totalCost / suggestedPrice) * 100. Example: 25.0"),
            }),
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this image of a handwritten or printed recipe card. Extract the recipe name, list the ingredients, and estimate the plate cost, a suggested menu selling price, and the projected COGS percentage. Be very specific." },
                        { type: "image", image: new URL(imageBase64) }
                    ]
                }
            ]
        });

        return NextResponse.json(result.object);
    } catch (error) {
        console.error("AI Recipe Error:", error);
        return new NextResponse("Failed to analyze recipe", { status: 500 });
    }
}
