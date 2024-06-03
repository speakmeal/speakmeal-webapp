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

interface EditState {
  name: boolean;
  age: boolean;
  sex: boolean;
}

const AccountPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isEditing, setIsEditing] = useState<EditState>({
    name: false,
    age: false,
    sex: false,
  });
  const [personalInfo, setPersonalInfo] = useState<UserDetails>(emptyUserDetails);
  const [ planName, setPlanName ] = useState<string>(''); 
  const { showAlert, message, type, triggerAlert } = useAlert();

  const loadDetails = async () => {
    //get user's profile from the database
    const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .single();

    if (profileError) {
      triggerAlert(profileError.message, "error");
      setIsLoading(false);
      return;
    }
    setPersonalInfo(profile)

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

  useEffect(() => {
    loadDetails();
  }, []);

  const handleEdit = (field: string) => {
    setIsEditing((prev: any) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const supabase = createClient();

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingIndicator />
      </div>
    );
  }

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

          <main className="p-6 text-center">
            <h1 className="text-4xl font-bold text-center mb-10">Account</h1>

            <section className="mb-5">
              <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
              <div className="flex flex-col space-y-5 justify-center items-center w-full">
                {["name", "age", "sex"].map((key) => (
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
              </div>

              <button className="btn btn-primary w-32 mt-5">Save</button>
              <div className="w-full border-t-4 mt-5 rounded-lg"></div>
            </section>

            <section className="mb-5">
              <h2 className="text-2xl font-bold mb-4">Account Details</h2>
              <p className="text-md">
                <b>Email:</b> {personalInfo.email}
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-semibold ml-1 underline">
                Reset Password
              </button>

              <div className="w-full border-t-4 mt-5 rounded-lg"></div>
            </section>

            <section className="mb-5">
              <h2 className="text-2xl font-bold mb-4">Subscription</h2>
              <p className="text-md">
                <b>Plan:</b> {planName}
              </p>
              <button className="btn btn-primary mt-3">
                Manage Subscription
              </button>

              <div className="w-full border-t-4 mt-5 rounded-lg"></div>
            </section>

            <div className="flex justify-center mt-5">
              <button
                className="btn btn-error text-white"
                onClick={() => supabase.auth.signOut()}
              >
                Log Out
              </button>
            </div>
          </main>
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default AccountPage;
