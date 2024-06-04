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
import { formatDate } from "../Utils/helpers";

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

  //load the user's profile and measurements
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

  //save changes to the user's goals to the database
  const saveGoals = async () => {
    setIsLoading(true);
    const { error } = await supabase
    .from("users")
    .update({
      target_daily_calories: userProfile.target_daily_calories,
    })
    .eq('id', userProfile.id);

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    triggerAlert("Goals updated successfully", "success");
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
                Progress
              </h1>

              {startingMeasurement && endingMeasurement ? (
                <div className="overflow-x-auto mt-20">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>
                          Start - {formatDate(startingMeasurement.created_at)}
                        </th>
                        <th>
                          Current - {formatDate(endingMeasurement.created_at)}
                        </th>
                        <th>Change</th>
                      </tr>
                    </thead>

                    <tbody>
                      {[
                        [
                          "height_cm",
                          "weight_kg",
                          "abdomen_cm",
                          "hip_cm",
                          "chest_cm",
                        ].map((key, index) => {
                          const [name, unit] = key.split("_");
                          const change = (endingMeasurement[key as keyof Measurement] as number) - (startingMeasurement[key as keyof Measurement] as number);
                          const percentageChange = 100 * (change / (startingMeasurement[key as keyof Measurement] as number));

                          return (
                            <tr key={index}>
                              <td>
                                {name.charAt(0).toUpperCase() + name.slice(1)} (
                                {unit})
                              </td>
                              <td>
                                {startingMeasurement[key as keyof Measurement]}
                              </td>
                              <td>
                                {endingMeasurement[key as keyof Measurement]}
                              </td>
                              <td>
                                {change} ({percentageChange.toFixed(2)} %)
                              </td>
                            </tr>
                          );
                        }),
                      ]}
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

              <div className="border-t-2 rounded-full mt-20 mx-10"></div>

              <h1 className="text-4xl font-semibold text-center mt-5">Goals</h1>

              <div className="text-center">
                <div className="flex flex-row justify-center items-center space-x-5 mt-10">
                  <p>Daily Calorie Target: </p>
                  <input
                    className="input input-bordered text-sm"
                    value={userProfile.target_daily_calories}
                    type="number"
                    onChange={(e) =>
                      setUserProfile((prev) => ({
                        ...prev,
                        target_daily_calories: parseInt(e.target.value),
                      }))
                    }
                  ></input>
                </div>

                <button className="btn btn-primary mt-10 w-32" onClick={saveGoals}>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default Goals;
