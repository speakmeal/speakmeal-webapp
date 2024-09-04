import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/Utils/supabase/server";
import { createClient as createAdminClient, SupabaseClient } from "@supabase/supabase-js";

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

  // check if the request made by the user is within the limits of their subscription
  // free users only get 12 Open AI requests for free
  const { data: userSubscription, error: subError } = await supabaseServerClient
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    console.log(subError);
    return [false, "Error fetching subscription"];
  }

  // If the user doesn't have a subscription, check their request limit
  if (!userSubscription) {
    const { count, error: requestError } = await supabaseServerClient
      .from("meal_conversions")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      ); //only get requests made this month

    if (requestError) {
      return [false, "Error fetching request count"];
    }

    // If the number of requests made this month exceeds 5, return an error
    if (count! >= 5) {
      return [false, "Request limit reached for this month"];
    }
  }

  return [true, user.id];
}

export async function logPaidAPIRequest(userId: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { error } = await supabaseAdmin.from("meal_conversions").insert({
    user_id: userId,
  });

  return error ? false : true;
}
