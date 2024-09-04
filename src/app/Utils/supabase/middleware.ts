/**
 * Utility function to refresh the session tokens and update the cookies of the incoming request
 * This also checks if the user is logged in and redirects them to the login page if they are not and try to access a protected page
 */
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next();
  const url = req.nextUrl.clone()

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
  await supabase.auth.getUser();

  console.log(req.nextUrl.pathname, session?.refresh_token);

  //if requested url is public there is no need to check session
  const publicUrls = ["/", "/LogIn", "/SignIn", "/PasswordReset", "/api/auth", "/api/stripe/webhook"];
  if (publicUrls.includes(req.nextUrl.pathname)) {
    return res;
  }

  //if user is not logged in and tries to access protected url, redirect them to the login page
  if (!session) {
    url.pathname = "/LogIn"
    return NextResponse.redirect(url)
  }

  //user has valid session and subscription, so there is no need to redirect
  return res;
}
