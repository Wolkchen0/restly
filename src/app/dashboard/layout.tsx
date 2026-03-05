import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatBot from "@/components/ChatBot";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="dashboard-layout">
            <Sidebar
                restaurantName={session.user?.name || "Restaurant"}
                plan={(session.user as any)?.plan || "trial"}
            />
            <div className="main-content">
                {children}
            </div>
            <ChatBot restaurantName={session.user?.name || "Restaurant"} />
        </div>
    );
}
