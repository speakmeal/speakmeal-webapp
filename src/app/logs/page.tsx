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
import { useRouter } from "next/navigation";
import { addDays, subDays } from "date-fns";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import PieChart from "../meals/PieChart";

const Logs: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const { showAlert, message, type, triggerAlert } = useAlert();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const supabase = createClient();
  const router = useRouter();

  const loadMealData = async (date: Date) => {
    //get saved meal data
    const { data: meals, error: mealsError } = await supabase
      .from("meal")
      .select("*, food_item(*)")
      .gte("created_at", date.toISOString().split("T")[0] + "T00:00:00")
      .lt("created_at", date.toISOString().split("T")[0] + "T23:59:59")
      .order("created_at", { ascending: false });

    if (mealsError) {
      triggerAlert(mealsError.message, "error");
    } else {
      setMeals(meals);
    }
  };

  const loadMeasurementData = async (date: Date) => {
    const { data: measurements, error: measurementError } = await supabase
      .from("measurement")
      .select("*") //note that there is no need to filter by user id due to row-level security policy
      .gte("created_at", date.toISOString().split("T")[0] + "T00:00:00")
      .lt("created_at", date.toISOString().split("T")[0] + "T23:59:59")
      .order("created_at", { ascending: false }); //sort records by date of creation and show the most recent at the top

    if (measurementError) {
      triggerAlert(measurementError.message, "error");
    } else {
      setMeasurements(measurements);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await loadMealData(selectedDate);
    await loadMeasurementData(selectedDate);
    setIsLoading(false);
  };

  useEffect(() => {
    //load the saved meals and measurements for the selected date
    loadData();
  }, [selectedDate]);

  const handlePrevDay = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  const getDayMacrosTotals = () => {
    //get the macro totals for all meals of the day to display in a pie chart
    let totals = { "Carbohydrates (g)": 0, "Protein (g)": 0, "Fat (g)": 0 };
    meals.forEach((meal) => {
      const mealTotals = getTotals(meal.food_item);
      totals["Carbohydrates (g)"] += mealTotals.carbs_g;
      totals["Protein (g)"] += mealTotals.protein_g;
      totals["Fat (g)"] += mealTotals.fat_g;
    });
    return totals;
  };

  const getCaloriesPerMeal = () => {
    return meals.map((meal) => ({
      type: meal.type,
      calories: getTotals(meal.food_item).calories,
    }));
  };

  const dateToString = (date: Date) => {
    //convert Date object to string format that matches format expected by 'date' type inputs
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full min-h-screen bg-black">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/logs"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col mr-2">
          <header className="flex justify-between items-center px-6 py-4 rounded-lg m-4">
            <button className="md:hidden mr-5" onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
          </header>

          {isLoading ? (
            <div className="h-screen flex justify-center items-center">
              <LoadingIndicator />
            </div>
          ) : (
            <div>
              <h1 className="text-center text-4xl font-semibold text-white">
                My Logs
              </h1>

              <div className="flex flex-row justify-between items-center mt-10 px-10">
                <button className="btn" onClick={handlePrevDay}>
                  <FaArrowLeft />
                </button>
                <div>
                  <input
                    type="date"
                    value={dateToString(selectedDate)}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                    }}
                    className="input bg-white text-black text-lg"
                  />
                </div>
                <button className="btn" onClick={handleNextDay}>
                  <FaArrowRight />
                </button>
              </div>

              {meals.length > 0 ? (
                <div className="w-full">
                  <div className="flex flex-col items-center justify-center md:flex-row md:space-x-5 mt-5">
                    <div className="w-1/2 p-4">
                      <h2 className="text-center text-xl text-white">
                        Macros Breakdown
                      </h2>
                      <PieChart chartData={getDayMacrosTotals()} />
                    </div>
                    <div className="w-1/2 p-4">
                      <h2 className="text-center text-xl text-white">
                        Calories Per Meal
                      </h2>
                      <PieChart
                        chartData={getCaloriesPerMeal().reduce(
                          (acc: any, meal) => ({
                            ...acc,
                            [meal.type]: (acc[meal.type] || 0) + meal.calories,
                          }),
                          {}
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-5 md:w-[80vw] w-screen">
                    <h2 className="p-5 text-white text-xl">Meals</h2>

                    <div className="overflow-x-scroll overflow-y-scroll border-2 rounded-md text-white mx-5">
                      <table className="table">
                        <thead className="text-white">
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
                          {meals.map((meal, index) => {
                            const totals = getTotals(meal.food_item);
                            return (
                              <tr
                                className="hover:cursor-pointer hover:bg-[#4F19D6]"
                                key={index}
                                onClick={() => router.push(`/meals/${meal.id}`)}
                              >
                                <td>{meal.type}</td>
                                <td>{formatDate(meal.created_at)}</td>
                                <td>{totals.carbs_g.toFixed(2)}</td>
                                <td>{totals.protein_g.toFixed(2)}</td>
                                <td>{totals.fat_g.toFixed(2)}</td>
                                <td>{totals.calories.toFixed(0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-white text-xl mt-10 p-5">Meals</h1>

                  <p className="text-gray-600 mt-2 pl-5">No meals recorded</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-10 md:w-[80vw] w-screen">
            <h1 className="text-white text-lg p-5">Measurements</h1>

            {measurements.length > 0 ? (
              <div className="overflow-x-scroll overflow-y-scroll border-2 rounded-lg text-white mb-5 mx-5">
                <table className="table">
                  <thead className="text-white">
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
                    {measurements.map((measurement, index) => (
                      <tr
                        className="hover:cursor-pointer hover:bg-[#4F19D6]"
                        key={index}
                        onClick={() => router.push(`/measurements/${measurement.id}`)}
                      >
                        <td>{formatDate(measurement.created_at)}</td>
                        <td>{measurement.weight_kg.toFixed(2)}</td>
                        <td>{measurement.height_cm.toFixed(2)}</td>
                        <td>{measurement.abdomen_cm.toFixed(2)}</td>
                        <td>{measurement.hip_cm.toFixed(2)}</td>
                        <td>{measurement.chest_cm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="pl-5 pb-5 text-gray-600">
                No measurements recorded
              </p>
            )}
          </div>
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default Logs;
