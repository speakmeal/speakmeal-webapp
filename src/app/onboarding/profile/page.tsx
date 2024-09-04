import { createClient } from "@/app/Utils/supabase/server";
import { permanentRedirect } from "next/navigation";
import ProfileSetUpPage from "./ProfileSetUpPage";
import { isProfileSetUp } from "@/app/Utils/helpers";

//server-side component
const ProfilePage: React.FC = async () => {
    const supabase = createClient();
    const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .maybeSingle();
    //only returns the user's profile due to row-level security

    //error getting the user's profile
    if (error){
        console.log(error.message);
        return permanentRedirect('/dashboard');
    }

    if (profile){
        //user already has a profile, so redirect them to the dashboard
        if (isProfileSetUp(profile)){
            return permanentRedirect("/dashboard");
        }
    }


    return (
        <ProfileSetUpPage />
    )
}

export default ProfilePage;