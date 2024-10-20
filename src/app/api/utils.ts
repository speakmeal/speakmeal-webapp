import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/Utils/supabase/server";
import { createClient as createAdminClient, SupabaseClient } from "@supabase/supabase-js";
import { TRIAL_PERIOD_DAYS } from "../types_db";

export async function validateRequest(req: NextRequest) {
  /**
   * Given a request object, extract the authorization token to get the user that made the request and check if they are allowed to make it
   */

  //get token
  const token = req.headers.get("Authorization")?.split("Bearer ")[1];
  if (!token) {
    return [false, "Missing auth token"];
  }

  //check if user is logged in
  const supabaseServerClient = createClient();
  const {
    data: { user },
    error,
  } = await supabaseServerClient.auth.getUser(token);
  if (error || !user) {
    return [false, "Invalid user"];
  }


  //if user's account was created less than 3 days ago, they have a free trial, so no need to check subscription
  const creationDate = new Date(user.created_at);
  const now = new Date();
  if (now.getTime() - creationDate.getTime() < TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000){
    return [true, user.id];
  } 

  // check if the request made by the user is within the limits of their subscription
  // free users only get 12 Open AI requests for free
  const { data: userSubscription, error: subError } = await supabaseServerClient
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError || !userSubscription) {
    console.log(subError);
    return [false, "Error fetching subscription"];
  }

  return [true, user.id];
}