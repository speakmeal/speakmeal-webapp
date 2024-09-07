"use client";

import { User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import {
  emptyUserDetails,
  Meal,
  Measurement,
  Subscription,
  UserDetails,
} from "../types_db";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import DashSidebar from "../Components/DashSidebar";
import { createClient } from "../Utils/supabase/client";
import { useAlert } from "../Components/Alert/useAlert";
import Alert from "../Components/Alert/Alert";
import LoadingIndicator from "../Components/LoadingIndicator";
import { FaMicrophone, FaTag, FaTape, FaTasks, FaUser } from "react-icons/fa";
import { formatDate, getTotals } from "../Utils/helpers";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

interface DailyBreakdown {
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  calories_breakfast: number;
  calories_lunch: number;
  calories_dinner: number;
  calories_snacks: number;
  calories: number;
}

const emptyBreakdown: DailyBreakdown = {
  carbs_g: 0,
  protein_g: 0,
  fat_g: 0,
  calories_breakfast: 0,
  calories_lunch: 0,
  calories_dinner: 0,
  calories_snacks: 0,
  calories: 0,
};

interface LineData {
  values: number[];
  dates: string[];
}

//Note: Checks to see if user is logged in and has valid subscription are done server-side through the supabase middleware script.

const DashboardPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert, message, type, triggerAlert } = useAlert();

  const [userData, setUserData] = useState<UserDetails>(emptyUserDetails);
  const [userMeals, setUserMeals] = useState<Meal[]>([]);
  const [userMeasurements, setUserMeasurements] = useState<Measurement[]>([]);

  const [dailyBreakdown, setDailyBreakdown] =
    useState<DailyBreakdown>(emptyBreakdown);
  const [caloriesLineData, setCaloriesLineData] = useState<LineData>({
    values: [],
    dates: [],
  });
  const [weightLineData, setWeightLineData] = useState<LineData>({
    values: [],
    dates: [],
  });
  const router = useRouter();
  const supabase = createClient();

  const doughnutData = {
    labels: ["Protein", "Carbohydrates", "Fats"],
    datasets: [
      {
        data: [
          dailyBreakdown.protein_g,
          dailyBreakdown.carbs_g,
          dailyBreakdown.fat_g,
        ],
        backgroundColor: ["#32CD32", "#4F19D6", "#f52011"],
        hoverBackgroundColor: ["#32CD32", "#4F19D6", "#f52011"],
      },
    ],
  };

  const calorieLineGraphData = {
    labels: caloriesLineData.dates,
    datasets: [
      {
        label: "Calories (Kcal)",
        data: caloriesLineData.values,
        fill: false,
        backgroundColor: "#4F19D6",
        borderColor: "#4F19D6",
      },
    ],
  };

  const weightLineGraphData = {
    labels: weightLineData.dates,
    datasets: [
      {
        label: "Weight (Kg)",
        data: weightLineData.values,
        fill: false,
        backgroundColor: "#4F19D6",
        borderColor: "#4F19D6",
      },
    ],
  };

  //get the date in a specified format
  const pretifyDate = (ISODate: string, isNumeric: boolean) => {
    const date = new Date(ISODate);
    const monthIndex = date.getMonth();
    const day = date.getDate();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    if (isNumeric) {
      return `${String(day).padStart(2, "0")}/${String(monthIndex + 1).padStart(
        2,
        "0"
      )}`;
    } else {
      return `${months[monthIndex]} ${day}`;
    }
  };

  //get tiemstamps for the start and end of the current day
  const getCurrentDayRange = () => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    return {
      start: startOfDay,
      end: endOfDay,
    };
  };

  //generate range of dates going from <days> days before today to today
  const generateDateRange = (days: number) => {
    const dates = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(pretifyDate(date.toISOString(), true));
    }
    return dates;
  };

  //get the macro totals for the current day
  const getMacroTotals = (meals: Meal[]) => {
    const { start: dayStart, end: dayEnd } = getCurrentDayRange();

    return meals
      .filter(
        (meal) =>
          new Date(meal.created_at) >= dayStart &&
          new Date(meal.created_at) <= dayEnd
      )
      .reduce(
        (acc, meal) => {
          const { carbs_g, protein_g, fat_g, calories } = getTotals(
            meal.food_item
          ); //get meal totals
          return {
            carbs_g: acc.carbs_g + carbs_g,
            protein_g: acc.protein_g + protein_g,
            fat_g: acc.fat_g + fat_g,
            calories: acc.calories + calories,
            calories_breakfast:
              meal.type === "Breakfast"
                ? acc.calories_breakfast + calories
                : acc.calories_breakfast,
            calories_lunch:
              meal.type === "Lunch"
                ? acc.calories_lunch + calories
                : acc.calories_lunch,
            calories_dinner:
              meal.type === "Dinner"
                ? acc.calories_dinner + calories
                : acc.calories_dinner,
            calories_snacks:
              meal.type === "Snack"
                ? acc.calories_snacks + calories
                : acc.calories_snacks,
          };
        },
        {
          carbs_g: 0,
          protein_g: 0,
          fat_g: 0,
          calories_breakfast: 0,
          calories_lunch: 0,
          calories_dinner: 0,
          calories_snacks: 0,
          calories: 0,
        }
      );
  };

  //get total calories for each day for the graph
  const getCaloriesPerDay = (meals: Meal[], days = 7) => {
    const dateRange = generateDateRange(days);
    console.log(dateRange);
    const groupedMeals = meals.reduce((acc: any, meal) => {
      const date = pretifyDate(meal.created_at, true);
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += meal.food_item.reduce((sum, item) => sum + item.calories, 0);
      return acc;
    }, {});

    // Ensure all dates in the range are represented
    const caloriesPerDay = dateRange.map((date) => groupedMeals[date] || 0);
    return { dates: dateRange, calories: caloriesPerDay };
  };

  //get weight over time for the graphhhgbhgb
  const getWeightPerDay = (measurements: Measurement[], days = 7) => {
    const dateRange = generateDateRange(days);
    const dateMeasurements = measurements.reduce((acc: any, measurement) => {
      const date = pretifyDate(measurement.created_at, true);
      acc[date] = measurement.weight_kg;
      return acc;
    }, {});

    // Ensure all dates in the range are represented
    let prev = 0;
    const weightPerDay = dateRange.map((date) => {
      if (dateMeasurements[date]) {
        prev = dateMeasurements[date];
        return dateMeasurements[date];
      } else {
        //if no weight was entered on the day, register it as having stayed the same
        return prev;
      }
    });
    return { dates: dateRange, weights: weightPerDay };
  };

  //get the user's profile data, meals and measurements
  const loadData = async () => {
    const { data: userData, error } = await supabase
      .from("users")
      .select("*, meal(*, food_item(*)), measurement(*)")
      .single();

    console.log(userData);
    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    setUserData(userData);
    setUserMeals(userData.meal);
    setUserMeasurements(userData.measurement);

    //set the macro data for the doughnut graph
    setDailyBreakdown(getMacroTotals(userData.meal));

    const { dates, calories } = getCaloriesPerDay(userData.meal, 30);
    setCaloriesLineData({ dates: dates, values: calories });

    const { dates: weightDates, weights } = getWeightPerDay(
      userData.measurement,
      30
    );
    setWeightLineData({ dates: weightDates, values: weights });                
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('loading data');
    loadData();
  }, []);

  return (
    <div className="flex flex-row min-h-screen w-full bg-black">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/dashboard"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col md:flex-row mr-2">
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
            <div className="flex-1">
              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 justify-between items-center rounded-lg m-4">
                <h1 className="text-2xl font-bold text-white">
                  Hello {userData.name || ""} 👋 Welcome back{" "}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Image
                      src="/assets/user-avatar.png"
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="text-white">{userData.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <main className="p-4 flex-1">
                <div className="flex flex-row w-full items-center justify-center">
                  <button
                    className="rounded-lg text-white w-32 h-32 shadow-md m-5 hover:bg-purple-500 bg-opacity-80 gradient-bg flex flex-col justify-center items-center space-y-3"
                    onClick={() => router.push("/speakMeal")}
                  >
                    <FaMicrophone size={40} />
                    <p className="font-semibold text-xs">Speak your meal</p>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center space-x-0 space-y-2 md:space-x-5 md:space-y-0">
                  <button
                    className="rounded-full bg-[#4F19D6] text-white w-64 py-2 shadow-md hover:bg-purple-500 bg-opacity-80"
                    onClick={() => router.push("/meals/new")}
                  >
                    Log Meal
                  </button>

                  <button
                    className="rounded-full bg-[#4F19D6] text-white w-64 py-2 shadow-md hover:bg-purple-500 bg-opacity-80"
                    onClick={() => router.push("/measurements/new")}
                  >
                    Log Measurement
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full mt-10">
                  <div className="bg-gray-600 bg-opacity-30 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-white">
                      {"Today's Intake"}
                    </h2>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        {pretifyDate(new Date().toISOString(), false)}
                      </p>
                      <div className="bg-gray-200 h-4 rounded-full mt-2">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{
                            width: `${
                              100 *
                              Math.min(
                                1,
                                dailyBreakdown.calories /
                                  userData.target_daily_calories
                              )
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="mt-2 text-gray-600 text-sm">
                        {dailyBreakdown.calories} /{" "}
                        {userData.target_daily_calories} Kcal
                      </p>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-white">Log</h3>
                      <div className="text-center mt-2">
                        <div className="grid grid-cols-3 items-center space-y-3 justify-center space-x-5">
                          <span className="text-gray-600">Breakfast 🥚</span>
                          <span className="text-gray-600">
                            {dailyBreakdown.calories_breakfast} Kcal
                          </span>
                          <span className="text-[#4F19D6]">
                            {dailyBreakdown.calories > 0
                              ? (
                                  100 *
                                  (dailyBreakdown.calories_breakfast /
                                    dailyBreakdown.calories)
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                          <span className="text-gray-600">Lunch 🥗</span>
                          <span className="text-gray-600">
                            {dailyBreakdown.calories_lunch} Kcal
                          </span>
                          <span className="text-[#4F19D6]">
                            {dailyBreakdown.calories > 0
                              ? (
                                  100 *
                                  (dailyBreakdown.calories_lunch /
                                    dailyBreakdown.calories)
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                          <span className="text-gray-600">Dinner 🍕</span>
                          <span className="text-gray-600">
                            {dailyBreakdown.calories_dinner} Kcal
                          </span>
                          <span className="text-[#4F19D6]">
                            {dailyBreakdown.calories > 0
                              ? (
                                  100 *
                                  (dailyBreakdown.calories_dinner /
                                    dailyBreakdown.calories)
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                          <span className="text-gray-600">Snacks 🍿</span>
                          <span className="text-gray-600">
                            {dailyBreakdown.calories_snacks} Kcal
                          </span>
                          <span className="text-[#4F19D6]">
                            {dailyBreakdown.calories > 0
                              ? (
                                  100 *
                                  (dailyBreakdown.calories_snacks /
                                    dailyBreakdown.calories)
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-600 bg-opacity-30 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-white">
                      {"Today's macros"}
                    </h2>
                    {dailyBreakdown.carbs_g === 0 &&
                    dailyBreakdown.protein_g === 0 &&
                    dailyBreakdown.fat_g === 0 ? (
                      <div className="text-gray-600 mt-5">No data to show</div>
                    ) : (
                      <div className="h-64 flex flex-col justify-center items-center mt-5">
                        <Doughnut data={doughnutData} />
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-600 bg-opacity-30 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-white">
                      Macro goals
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-5 items-center mt-7">
                      {/* Carbs total */}
                      <p className="text-white">Carbohydrates</p>

                      <div className="bg-gray-200 h-4 rounded-full mt-2 w-16">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{
                            width: `${
                              100 *
                              Math.min(
                                1,
                                Math.max(dailyBreakdown.carbs_g /
                                         userData.carbohydrates_grams_goal, 
                                         0.15)
                              )
                            }%`,
                          }}
                        ></div>
                      </div>

                      <p className="mt-2 text-gray-600 text-sm">
                        {Math.round(dailyBreakdown.carbs_g)} /{" "}
                        {userData.carbohydrates_grams_goal}g
                      </p>
                      
                      {/* Protein total */}
                      <p className="text-white">Protein</p>

                      <div className="bg-gray-200 h-4 rounded-full mt-2 w-16">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{
                            width: `${
                              100 *
                              Math.min(
                                1,
                                Math.max(dailyBreakdown.protein_g /
                                         userData.protein_grams_goal, 
                                         0.15) 
                              )
                            }%`,
                          }}
                        ></div>
                      </div>

                      <p className="mt-2 text-gray-600 text-sm">
                        {Math.round(dailyBreakdown.protein_g)} /{" "}
                        {userData.protein_grams_goal}g
                      </p>
                      
                      {/* Fat total */}
                      <p className="text-white">Fat</p>

                      <div className="bg-gray-200 h-4 rounded-full mt-2 w-16">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{
                            width: `${
                              100 *
                              Math.min(
                                1,
                                Math.max(dailyBreakdown.fat_g /
                                         userData.fat_grams_goal, 
                                         0.15)
                              )
                            }%`,
                          }}
                        ></div>
                      </div>

                      <p className="mt-2 text-gray-600 text-sm">
                        {Math.round(dailyBreakdown.fat_g)} /{" "}
                        {userData.fat_grams_goal}g
                      </p>
                    </div>


                  </div>

                  <div className="bg-gray-600 bg-opacity-30 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-white">
                      Calorie Tracker
                    </h2>
                    <Line data={calorieLineGraphData} className="mt-5" />
                  </div>

                  <div className="bg-gray-600 bg-opacity-30 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-white">
                      Weight Tracker
                    </h2>
                    <Line data={weightLineGraphData} className="mt-5" />
                  </div>
                </div>
              </main>
            </div>
          )}
        </div>
      )}

      {showAlert && <Alert message={message} type={type} />}
    </div>
  );
};

export default DashboardPage;
