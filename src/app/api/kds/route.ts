import { NextResponse } from "next/server";
import { getKDSSnapshot } from "@/services/kds";
import { auth } from "@/lib/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const snapshot = getKDSSnapshot();
    return NextResponse.json(snapshot);
}
