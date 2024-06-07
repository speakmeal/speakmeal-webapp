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
        backgroundColor: ["#32CD32", "#6a0dad", "#000000"],
        hoverBackgroundColor: ["#32CD32", "#6a0dad", "#000000"],
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
        backgroundColor: "#6a0dad",
        borderColor: "#6a0dad",
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
        backgroundColor: "#6a0dad",
        borderColor: "#6a0dad",
      },
    ],
  };

  //get the date in a specified format
  const pretifyDate = (ISODate: string, isNumeric: boolean) => {
    const date = new Date(ISODate);
    const monthIndex = date.getMonth();
    const day = date.getDay();

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

    if (error) {
      triggerAlert(error.message, "error");
      setIsLoading(false);
      return;
    }

    setUserData(userData);
    setUserMeals(userData.meal);
    setUserMeasurements(userData.measurement);

    setIsLoading(false);

    //set the macro data for the doughnut graph
    setDailyBreakdown(getMacroTotals(userData.meal));

    const { dates, calories } = getCaloriesPerDay(userData.meal, 30);
    setCaloriesLineData({ dates: dates, values: calories });

    const { dates: weightDates, weights } = getWeightPerDay(
      userData.measurement,
      30
    );
    setWeightLineData({ dates: weightDates, values: weights });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex w-full min-h-screen">
      <DashSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        location="/dashboard"
      />

      {!isSidebarOpen && (
        <div className="flex flex-1 flex-col mr-2">
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
              <div className="flex justify-between items-center rounded-lg m-4">
                <h1 className="text-2xl font-bold">
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
                      <p>{userData.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(!userData.name || userMeasurements.length === 0) && (
                <div className="flex flex-col space-y-2 rounded-full p-5 mx-5 shadow-md justify-center">
                  {!userData.name && (
                    <div className="flex flex-row items-center space-x-4">
                      <FaUser />
                      <p>
                        {"You haven\'t told us your name yet."}{" "}
                        <a className="text-primary" href="/account">
                          Finish setting up your profile
                        </a>
                      </p>
                    </div>
                  )}

                  {userMeasurements.length === 0 && (
                    <div className="flex flex-row items-center space-x-4">
                      <FaTape />
                      <p>
                        {"You haven\'t added any measurements yet."}{" "}
                        <a className="text-primary" href="/measurements/new">
                          Add one now to start tracking your progress.
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <main className="p-4 h-32">
                <div className="flex flex-row justify-center">
                  <button
                    className="btn bg-lime-500 text-white hover:bg-purple-500 hover:shadow-lg"
                    onClick={() => router.push("/speakMeal")}
                  >
                    Describe your meal <FaMicrophone />
                  </button>
                </div>
                <div className="flex flex-row items-center justify-center space-x-5">
                  <button
                    className="btn rounded-full bg-purple-500 text-white w-64 shadow-md m-5 hover:bg-lime-500"
                    onClick={() => router.push("/meals/new")}
                  >
                    Log Meal
                  </button>

                  <button
                    className="btn rounded-full bg-purple-500 text-white w-64 shadow-md m-5 hover:bg-lime-500"
                    onClick={() => router.push("/measurements/new")}
                  >
                    Log Measurement
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold">{"Today's Intake"}</h2>
                    <div className="mt-4">
                      <p className="text-sm">
                        {pretifyDate(new Date().toISOString(), false)}
                      </p>
                      <div className="bg-gray-200 h-4 rounded-full mt-2">
                        <div
                          className="bg-purple-600 h-4 rounded-full"
                          style={{
                            width: `${
                              100 *
                              (Math.min(1, dailyBreakdown.calories /
                                userData.target_daily_calories))
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="mt-2">
                        {dailyBreakdown.calories} /{" "}
                        {userData.target_daily_calories} Kcal
                      </p>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-bold">Log</h3>
                      <ul className="mt-2">
                        <li className="flex justify-between py-1">
                          <span>Breakfast 🥚</span>
                          <span>{dailyBreakdown.calories_breakfast} Kcal</span>
                          <span className="text-purple-500">
                            {(
                              100 *
                              (dailyBreakdown.calories_breakfast /
                                dailyBreakdown.calories)
                            ).toFixed(1)}
                            %
                          </span>
                        </li>
                        <li className="flex justify-between py-1">
                          <span>Lunch 🥗</span>
                          <span>{dailyBreakdown.calories_lunch} Kcal</span>
                          <span className="text-purple-500">
                            {(
                              100 *
                              (dailyBreakdown.calories_lunch /
                                dailyBreakdown.calories)
                            ).toFixed(1)}
                            %
                          </span>
                        </li>
                        <li className="flex justify-between py-1">
                          <span>Dinner 🍕</span>
                          <span>{dailyBreakdown.calories_dinner} Kcal</span>
                          <span className="text-purple-500">
                            {(
                              100 *
                              (dailyBreakdown.calories_dinner /
                                dailyBreakdown.calories)
                            ).toFixed(1)}
                            %
                          </span>
                        </li>
                        <li className="flex justify-between py-1">
                          <span>Snacks 🍿</span>
                          <span>{dailyBreakdown.calories_snacks} Kcal</span>
                          <span className="text-purple-500">
                            {(
                              100 *
                              (dailyBreakdown.calories_snacks /
                                dailyBreakdown.calories)
                            ).toFixed(1)}
                            %
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold">
                      {"Today's Macros (g)"}
                    </h2>
                    <div className="h-64 flex justify-center">
                      <Doughnut data={doughnutData} />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold">Calorie Tracker</h2>
                    <Line data={calorieLineGraphData} />
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold">Weight Tracker</h2>
                    <Line data={weightLineGraphData} />
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
