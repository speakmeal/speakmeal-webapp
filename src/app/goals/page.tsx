"use client";
import { useEffect, useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useAlert } from "../Components/Alert/useAlert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { emptyUserDetails, Measurement, UserDetails } from "../types_db";
import { createClient } from "../Utils/supabase/client";
import { useRouter } from "next/navigation";
import Alert from "../Components/Alert/Alert";

const Goals: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const [startingMeasurement, setStartingMeasurement] =
    useState<Measurement | null>(null);
  const [endingMeasurement, setEndingMeasurement] =
    useState<Measurement | null>(null);
  const [userProfile, setUserProfile] = useState<UserDetails>(emptyUserDetails);

  const supabase = createClient();
  const router = useRouter();

  const loadData = async () => {
    setIsLoading(true);

    //get all of the user's measurements to have access to the starting and final ones
    const { data: measurements, error: measurementError } = await supabase
      .from("measurement")
      .select("*")
      .order("created_at", { ascending: true });

    if (measurementError) {
      triggerAlert(measurementError.message, "error");
      setIsLoading(false);
      return;
    }

    if (measurements.length > 0) {
      setStartingMeasurement(measurements[0]);
      setEndingMeasurement(measurements[measurements.length - 1]);
    }

    //get the user's profile data
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .single();

    if (profileError) {
      triggerAlert(profileError.message, "error");
      setIsLoading(false);
      return;
    }
    setUserProfile(profile);

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex w-full min-h-screen">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/goals"
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
            <div>
              <h1 className="text-4xl font-semibold text-center">
                Overall Progress
              </h1>

              {startingMeasurement && endingMeasurement ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Start</th>
                        <th>Current</th>
                        <th>Change</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>Height</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center mt-20 border-2 py-5 mx-20">
                  <h2>You have not taken any measurements yet</h2>
                  <button
                    className="btn btn-primary rounded-full mt-5 w-32"
                    onClick={() => router.push("/measurements/new")}
                  >
                    Do it now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default Goals;
