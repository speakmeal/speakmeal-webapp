import { hasProfileCalorieGoals } from "@/app/Utils/helpers";
import { createClient } from "@/app/Utils/supabase/server";
import { permanentRedirect } from "next/navigation";
import CaloriesGoalPage from "./CaloriesGoalPage";

const CaloriesGoal: React.FC = async () => {
    const supabase = createClient();
    const {data: profile, error} = await supabase
        .from("users")
        .select("*")
        .maybeSingle();

    if (error){
        return permanentRedirect("/dashboard");
    }

    if (profile){
        if (hasProfileCalorieGoals(profile)){
            //user has already set up the calorie goals, so redirect them to the dashboard
            return permanentRedirect("/dashboard");
        }
    }

    return (
        <CaloriesGoalPage />
    )
}

export default CaloriesGoal;