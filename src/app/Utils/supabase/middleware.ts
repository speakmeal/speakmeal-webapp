/**
 * Utility function to refresh the session tokens and update the cookies of the incoming request
 * This also checks if the user is logged in and redirects them to the login page if they are not and try to access a protected page
 */
import { TRIAL_PERIOD_DAYS } from "@/app/types_db";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next();
  const url = req.nextUrl.clone();

  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    }
  );

  //always allow api requests to pass 
  if (req.nextUrl.pathname.startsWith("/api")){
    return res;
  }

  //no need to check the session when trying to access public urls
  const publicUrls = ["/", "/LogIn", "/SignIn", "/PasswordReset"];
  if (publicUrls.includes(req.nextUrl.pathname))
    return res;

  //get current session / refresh it
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  //user tried to access private page without being logged in
  if (!user || error){
    console.error("Middleware: Error getting the user's session");

    if (error){
      console.error("Error: " + error.message);
    }

    url.pathname = "/LogIn";
    return NextResponse.redirect(url);
  }

  //no need to check if user has a valid subscription when they try to access the subscriptions page
  if (req.nextUrl.pathname === "/subscribe"){
    return res;
  }

  //check if the user has a valid subscription before letting them access a protected page

  //1. If user was created less than 3 days ago, (trial period), allow them to access every page
  const creationDate = new Date(user.created_at);
  const now = new Date();

  if (now.getTime() - creationDate.getTime() < TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000){
    return res;
  } 
  console.log("More than 3 days");

  //2. If user was created more than 3 days ago, trial period has expired, hence must check subscription.
  //If user does not have a valid subscription force them to get one by redirecting them to the subscription page
  const { data: userSubscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .eq("user_id", user.id)
    .maybeSingle();
  
  if (!userSubscription || subError){
    //user does not have a subscription
    url.pathname = "/subscribe";
    return NextResponse.redirect(url);
  }

  if (userSubscription.status !== "active") {
    //user's subscription has expired
    url.pathname = "/subscribe";
    return NextResponse.redirect(url);
  }

  //user has valid session and subscription, so there is no need to redirect
  return res;
}