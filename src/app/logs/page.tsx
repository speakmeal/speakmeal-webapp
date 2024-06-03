"use client";
import { useEffect, useState } from "react";
import DashSidebar from "../Components/DashSidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { Meal, Measurement } from "../types_db";
import { createClient } from "../Utils/supabase/client";
import { useAlert } from "../Components/Alert/useAlert";
import LoadingIndicator from "../Components/LoadingIndicator";
import Alert from "../Components/Alert/Alert";
import { formatDate, getTotals } from "../Utils/helpers";

const Logs: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();

  const loadData = async () => {
    setIsLoading(true);

    //get saved measurement data
    const { data: measurements, error: measurementError } = await supabase
      .from("measurement")
      .select("*") //note that there is no need to filter by user id due to row-level security policy
      .order("created_at", { ascending: false }); //sort records by date of creation and show the most recent at the top

    if (measurementError) {
      triggerAlert(measurementError.message, "error");
      setIsLoading(false);
      return;
    }
    setMeasurements(measurements);

    //get saved meal data
    const { data: meals, error: mealsError } = await supabase
      .from("meal")
      .select("*, food_item(*)")
      .order("created_at", { ascending: false }); //sort records by date of creation and show most recent at the top

    if (mealsError){
      triggerAlert(mealsError.message, "error");
      setIsLoading(false);
      return;
    }
    setMeals(meals);

    setIsLoading(false);
  };

  useEffect(() => {
    //load the saved meals and measurements from the database
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/logs"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col mr-2">
          <header className="flex justify-between items-center px-6 py-4 rounded-lg m-4">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-black" />
            </button>
          </header>

          <div>
            <h1 className="text-center text-4xl font-semibold">My logs</h1>

            <div className="mt-5">
              <h2 className="p-5 text-black text-xl">Meals</h2>
              <div className="overflow-x-auto overflow-y-scroll h-[45vh] border-2 rounded-md">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th>Date</th>
                      <th>Carbohydrates (g)</th>
                      <th>Protein (g)</th>
                      <th>Fat (g)</th>
                      <th>Calories</th>
                    </tr>
                  </thead>

                  <tbody>
                    {
                      meals.map((meal) => {
                        const totals = getTotals(meal.food_item);
                        return (
                          <tr className="hover hover:cursor-pointer">
                            <td>
                              {meal.type}
                            </td>
                            <td>
                              {formatDate(meal.created_at)}
                            </td>
                            <td>
                              {totals.carbs_g}
                            </td>
                            <td>
                              {totals.protein_g}
                            </td>
                            <td>
                              {totals.fat_g}
                            </td>
                            <td>
                              {totals.calories}
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 pb-5">
              <h2 className="p-5 text-black text-xl">Measurements</h2>

              <div className="overflow-x-auto overflow-y-scroll h-[45vh] border-2 rounded-lg">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Weight (kg)</th>
                      <th>Height (cm)</th>
                      <th>Abdomen (cm)</th>
                      <th>Hip (cm)</th>
                      <th>Chest (cm)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {
                      measurements.map((measurement) => (
                        <tr>
                          <td>{formatDate(measurement.created_at)}</td>
                          <td>{measurement.weight_kg}</td>
                          <td>{measurement.height_cm}</td>
                          <td>{measurement.abdomen_cm}</td>
                          <td>{measurement.hip_cm}</td>
                          <td>{measurement.chest_cm}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default Logs;
