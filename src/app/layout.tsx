import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#0A0A0F",
};

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
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Restly",
    },
    formatDetection: {
        telephone: false,
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
