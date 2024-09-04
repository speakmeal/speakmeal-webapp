import { SupabaseClient } from "@supabase/supabase-js";

export async function getMonthlyAICredits(supabase: SupabaseClient) {
    /**
     * Get the number of free AI credits that the user has left for the month
     */
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const { count, error: requestError } = await supabase
    .from("meal_conversions")
    .select("id", { count: "exact" })
    .eq("user_id", session?.user.id)
    .gte(
      "created_at",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    ); //only get requests made this month

  if (requestError || !count) {
    return 0;
  }

  // User gets 5 free credits per month, hence the number of credits remaining is equal to 5 minus the number of requests made
  return 5 - count!;
}


export async function getUserSubscription(supabase: SupabaseClient) {
    /**
     * Get the name of the user's subscription plan
     */
    const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .in("status", ["trialing", "active"])
    .maybeSingle();

  if (subscriptionError) {
    return "Free Plan";
  }
  return subscription ? subscription.prices.products.name : "Free Plan";
}