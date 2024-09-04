import { permanentRedirect } from "next/navigation";
import { createClient } from "../Utils/supabase/server";
import SpeakMealPage from "./SpeakMealPage";

const SpeakMeal: React.FC = async () => {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    console.error("Error getting user");
    return permanentRedirect("/dashboard");
  }

  // check if the request made by the user is within the limits of their subscription
  // free users only get 12 Open AI requests for free
  const { data: userSubscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*, prices(*, products(*))")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    console.error(subError);
    return permanentRedirect("/dashboard");
  }

  // If the user doesn't have a subscription, check their request limit
  if (!userSubscription) {
    const { count, error: requestError } = await supabase
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
      console.error("Error fetching request count");
      return permanentRedirect("/dashboard");
    }

    // If the number of requests made this month exceeds 12, return an error
    if (count! >= 5) {
      return permanentRedirect("/upgrade");
    }
  }

  return <SpeakMealPage />;
};

export default SpeakMeal;
