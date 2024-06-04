"use client";
import { useEffect, useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaEdit } from "react-icons/fa";
import { emptyUserDetails, UserDetails } from "../types_db";
import { createClient } from "../Utils/supabase/client";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { createStripePortal } from "../Utils/stripe/server";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

interface EditState {
  name: boolean;
  age: boolean;
  gender: boolean;
}

const AccountPage: React.FC = () => {
  const currentPath = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isEditing, setIsEditing] = useState<EditState>({
    name: false,
    age: false,
    gender: false,
  });
  const [personalInfo, setPersonalInfo] =
    useState<UserDetails>(emptyUserDetails);
  const [planName, setPlanName] = useState<string>("");
  const { showAlert, message, type, triggerAlert } = useAlert();

  const router = useRouter();
  const supabase = createClient();

  //get user's profile from the database
  const loadDetails = async () => {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .single();

    if (profileError) {
      triggerAlert(profileError.message, "error");
      setIsLoading(false);
      return;
    }
    setPersonalInfo(profile);

    //get the user's subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*, prices(*, products(*))")
      .in("status", ["trialing", "active"])
      .single();

    setPersonalInfo(profile);
    setPlanName(subscription.prices.products.name);
    setIsLoading(false);
  };

  //run loadDetails function on page load
  useEffect(() => {
    loadDetails();
  }, []);

  //save changes to the user's personal details to the database
  const saveChanges = async () => {
    setIsLoading(true);

    const { error } = await supabase
      .from("users")
      .update({
        name: personalInfo.name,
        age: personalInfo.age,
        gender: personalInfo.gender,
      })
      .eq("id", personalInfo.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    triggerAlert("Changes saved successfully", "success");
    setIsEditing({
      age: false,
      name: false,
      gender: false,
    });
  };

  //send password reset email
  const handlePasswordReset = async () => {
    setIsLoading(true);
    await supabase.auth.resetPasswordForEmail(personalInfo.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/PasswordReset`,
    });
    setIsLoading(false);
    triggerAlert("We've just sent you a password reset email.", "success");
  };

  //create a stripe subscription portal and redirect the user to it
  const handleSubscriptionManagement = async () => {
    setIsLoading(true);
    const redirectUrl = await createStripePortal(currentPath);
    return router.push(redirectUrl);
  };

  //log the user out and redirect them to the landing page
  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  //Toggle state of input to allow user to edit
  const handleEdit = (field: string) => {
    setIsEditing((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  //Modify the user details when one of the inputs changes
  const handleInputChange = (field: string, value: string | number) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex w-full min-h-screen">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/account"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col">
          <header className="flex justify-between items-center px-6 py-4 rounded-lg m-4">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-black" />
            </button>
          </header>

          {isLoading ? (
            <div className="h-screen flex justify-center items-center">
              <LoadingIndicator />
            </div>
          ) : (
            <main className="p-6 text-center">
              <h1 className="text-4xl font-bold text-center mb-10">Account</h1>

              <section className="mb-5">
                <h2 className="text-2xl font-bold mb-4">
                  Personal Information
                </h2>
                <div className="flex flex-col space-y-5 justify-center items-center w-full">
                  {["name", "age"].map((key) => (
                    <div key={key} className="flex items-center">
                      <label className="block text-gray-700 w-24 capitalize">
                        {key}:
                      </label>
                      <input
                        type={key === "age" ? "number" : "text"}
                        value={personalInfo[key as keyof UserDetails]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="input input-bordered w-full"
                        disabled={!isEditing[key as keyof EditState]}
                      />

                      <button
                        className="ml-2 text-blue-500"
                        onClick={() => handleEdit(key)}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  ))}

                  <div key={"sex"} className="flex items-center space-x-5">
                    <label className="block text-gray-700 w-24 capitalize">
                      Gender:
                    </label>
                    <select
                      className="select select-bordered max-w-xs"
                      disabled={!isEditing["gender"]}
                      value={personalInfo["gender"]}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                    >
                      <option>Not specified</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>

                    <button
                      className="ml-2 text-blue-500"
                      onClick={() => handleEdit("gender")}
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-32 mt-5"
                  onClick={saveChanges}
                >
                  Save
                </button>
                <div className="w-full border-t-4 mt-5 rounded-lg"></div>
              </section>

              <section className="mb-5">
                <h2 className="text-2xl font-bold mb-4">Account Details</h2>
                <p className="text-md">
                  <b>Email:</b> {personalInfo.email}
                </p>
                <button
                  className="text-purple-600 hover:text-purple-700 font-semibold ml-1 underline"
                  onClick={handlePasswordReset}
                >
                  Reset Password
                </button>

                <div className="w-full border-t-4 mt-5 rounded-lg"></div>
              </section>

              <section className="mb-5">
                <h2 className="text-2xl font-bold mb-4">Subscription</h2>
                <p className="text-md">
                  <b>Plan:</b> {planName}
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={handleSubscriptionManagement}
                >
                  Manage Subscription
                </button>

                <div className="w-full border-t-4 mt-5 rounded-lg"></div>
              </section>

              <div className="flex justify-center mt-5">
                <button className="btn btn-error text-white" onClick={logout}>
                  Log Out
                </button>
              </div>
            </main>
          )}
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default AccountPage;
