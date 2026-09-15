import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const isSignIn =
    pathname === "/admin/sign-in" || pathname.startsWith("/admin/sign-in/");

  if (!pathname.startsWith("/admin") || isSignIn) return;

  await auth.protect();

  const { userId, sessionClaims } = await auth();
  const metadata = (sessionClaims as { metadata?: { role?: string } } | null)
    ?.metadata;
  const isAdmin =
    userId === process.env.ADMIN_USER_ID || metadata?.role === "admin";

  if (!isAdmin) {
    const signInUrl = new URL("/admin/sign-in", request.url);
    signInUrl.searchParams.set("error", "forbidden");
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/admin(.*)"],
};
