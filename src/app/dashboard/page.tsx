import { permanentRedirect } from "next/navigation";
import { createClient } from "../Utils/supabase/server";
import { hasProfileCalorieGoals, isProfileSetUp } from "../Utils/helpers";
import DashboardPage from "./DashboardPage";

const Dashboard: React.FC = async () => {
    const supabase = createClient();
    const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .maybeSingle();

    if (error || !profile){
        //error getting the user's profile, typically when user is not logged in
        if (error){ console.log(error.message) };
        return permanentRedirect("/LogIn");
    }

    if (!isProfileSetUp(profile)){
        //user must set up profile before accessing dashboard
        return permanentRedirect("/onboarding/profile");
    }

    if (!hasProfileCalorieGoals(profile)){
        //user must set up calorie goals before accessing dashboard
        return permanentRedirect("/onboarding/calories-goal");
    }

    return (
        <DashboardPage />
    )
}

export default Dashboard;