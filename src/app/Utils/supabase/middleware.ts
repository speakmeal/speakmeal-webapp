/**
 * Utility function to refresh the session tokens and update the cookies of the incoming request
 * This also checks if the user is logged in and redirects them to the login page if they are not and try to access a protected page
 */
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next();
  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    }
  );

  //get current session / refresh it
  const {
    data: { session },
  } = await supabase.auth.getSession();

  //if requested url is public there is no need to check session
  const publicUrls = ["/", "/LogIn", "/SignIn", "/PasswordReset"];
  if (publicUrls.includes(req.nextUrl.pathname)) {
    return res;
  }

  //if user is not logged in and tries to access protected url, redirect them to the login page
  if (!session) {
    return NextResponse.rewrite(new URL("/LogIn", req.url));
  }

  //if requested url requires subscription, check if teh user has a valid subscription
  const exclusiveUrls = ["/dashboard", "/logs", "/goals", "/account"];
  if (exclusiveUrls.includes(req.nextUrl.pathname)) {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*, prices(*, products(*))")
      .in("status", ["trialing", "active"])
      .eq("user_id", session?.user.id)
      .maybeSingle();

    if (
      !subscription ||
      error ||
      (subscription.status !== "active" && subscription.status !== "trialing")
    ) {
      return NextResponse.rewrite(new URL("/Subscriptions", req.url));
    }
  }

  //user has valid session and subscription, so there is no need to redirect
  return res;
}