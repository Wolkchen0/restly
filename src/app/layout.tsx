import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Restly — AI Restaurant Manager",
    description: "The all-in-one AI-powered management platform for modern restaurants. Manage guests, inventory, and scheduling — all in one place.",
    keywords: "restaurant management, AI, inventory, reservations, scheduling",
    icons: {
        icon: "/favicon.png",
        apple: "/apple-icon.png",
    },
    openGraph: {
        title: "Restly — AI Restaurant Manager",
        description: "Run your restaurant smarter with AI-powered guest intelligence, real-time inventory, and smart scheduling.",
        type: "website",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>{children}</body>
        </html>
    );
}
