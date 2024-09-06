import { SupabaseClient } from "@supabase/supabase-js";

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