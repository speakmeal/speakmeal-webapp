//server-side component
import { createClient } from "@/app/Utils/supabase/server";
import { permanentRedirect } from "next/navigation";
import FirstMealPage from "./FirstMealPage";

const FirstMeal: React.FC = async () => {
  const supabase = createClient();
  const { data: meals, error } = await supabase.from("meal").select("*");
  //row level security ensures that only the meals for the user logged in are retrieved

  console.log("Meals: " + meals);

  if (error) {
    console.log(error.message);
    return permanentRedirect("/dashboard");
  }

  if (meals && meals.length < 0) {
    //user has already recorded a meal, hence redirect them to the dashboard
    return permanentRedirect("/dashboard");
  }

  return <FirstMealPage />;
};

export default FirstMeal;
