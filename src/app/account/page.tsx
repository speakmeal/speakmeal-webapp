"use client";
import { useEffect, useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { FaCrown, FaEdit } from "react-icons/fa";
import { emptyUserDetails, Subscription, SubscriptionWithProduct, UserDetails } from "../types_db";
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
  const [subscription, setSubscription] = useState<SubscriptionWithProduct | null>(null);
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
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*, prices(*, products(*))")
      .in("status", ["trialing", "active"])
      .maybeSingle();

    if (subscriptionError) {
      triggerAlert(subscriptionError.message, "error");
      setIsLoading(false);
      return;
    }

    setPersonalInfo(profile);
    setSubscription(subscription);
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
    <div className="flex w-full min-h-screen bg-black">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/account"
      />

      {showAlert && (
        <div className="absolute w-full">
          <Alert message={message} type={type} />
        </div>
      )}

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col">
          <header className="md:hidden flex justify-between items-center px-6 py-4 rounded-lg m-4 shadow-md">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
          </header>

          {isLoading ? (
            <div className="h-screen flex justify-center items-center">
              <LoadingIndicator />
            </div>
          ) : (
            <main className="p-6">
              <h1 className="text-4xl font-bold text-center mb-10 text-white">
                Account
              </h1>

              <section className="mb-10 bg-gray-600 bg-opacity-30 shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Personal Information
                </h2>
                <div className="flex flex-col items-center space-y-5 w-full">
                  {["name", "age"].map((key) => (
                    <div key={key} className="flex items-center w-64">
                      <label className="block text-white w-24 capitalize">
                        {key}:
                      </label>
                      <input
                        type={key === "age" ? "number" : "text"}
                        value={personalInfo[key as keyof UserDetails] as string}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="input input-bordered w-full"
                        disabled={!isEditing[key as keyof EditState]}
                      />

                      <button
                        className="ml-2 text-[#4F19D6]"
                        onClick={() => handleEdit(key)}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  ))}

                  <div key={"sex"} className="flex items-center space-x-5 w-64">
                    <label className="block text-white w-24 capitalize">
                      Gender:
                    </label>
                    <select
                      className="select select-bordered w-full"
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
                      className="ml-2 text-[#4F19D6]"
                      onClick={() => handleEdit("gender")}
                    >
                      <FaEdit />
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary mt-5" onClick={saveChanges}>
                  Save
                </button>
              </section>

              <section className="mb-10 rounded-lg p-6 bg-gray-600 bg-opacity-30 shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Account Details
                </h2>
                <p className="text-md mb-4 text-white">
                  <b>Email:</b> {personalInfo.email}
                </p>
                <button
                  className="text-[#4F19D6] hover:text-red-500 font-semibold underline"
                  onClick={handlePasswordReset}
                >
                  Reset Password
                </button>
              </section>

              <section className="mb-10 bg-gray-600 bg-opacity-30 shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white">
                  Subscription
                </h2>
                {/* <p className="text-md mb-4 text-[#4F19D6]">{planName}</p> (Bring back when multiple plans are added) */}
                {
                  subscription && (
                    subscription.status === "trialing" ? (
                      <p className="text-green-500">Trial ends on {subscription.trial_end?.split("T")[0]}</p>
                    ) : (
                      <div></div>
                      // Bring back once multiple plans are added
                      // <p className="text-green-500">
                      //   {subscription.prices?.products?.name}
                      // </p>
                    )
                  )
                }

                {/* {isTrialing && <p className="text-green-500">Trialing</p>} */}
                <button
                  className="btn btn-primary mt-5"
                  onClick={handleSubscriptionManagement}
                >
                  Manage Subscription
                </button>
              </section>

              <div className="flex justify-center">
                <button className="btn btn-error text-white" onClick={logout}>
                  Log Out
                </button>
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountPage;
