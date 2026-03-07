import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const count = await prisma.restaurant.count();
        return NextResponse.json({ success: true, count, message: "Database connected successfully!" });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, code: e.code, name: e.name }, { status: 500 });
    }
}
