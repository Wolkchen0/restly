import { NextResponse } from "next/server";
import { getInventory, getInventoryStats, getLowStockItems } from "@/services/toast";

export async function GET() {
    const inventory = getInventory();
    const stats = getInventoryStats();
    const lowStock = getLowStockItems();
    return NextResponse.json({ inventory, stats, lowStock });
}
