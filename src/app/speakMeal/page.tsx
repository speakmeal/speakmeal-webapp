import { permanentRedirect } from "next/navigation";
import { createClient } from "../Utils/supabase/server";
import SpeakMealPage from "./SpeakMealPage";

const SpeakMeal: React.FC = async () => {
  const supabase = createClient();
  return <SpeakMealPage />;
};

export default SpeakMeal;
