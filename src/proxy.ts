import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.cookies.get("authjs.session-token") || !!req.cookies.get("__Secure-authjs.session-token");

    if (pathname.startsWith("/dashboard") && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/signup"],
};
